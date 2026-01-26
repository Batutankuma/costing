// actions for reception (Prisma)
'use server';

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { handlePrismaError } from "@/middlewares/message_error";
import { CreateReceptionSchema, ReceptionSchema } from "@/models/mvc";
import { z } from "zod";

/**
 * Fonction utilitaire pour calculer le CMP (Coût Moyen Pondéré)
 * Importée depuis stocks/actions.ts
 */
async function calculateCMP(
  depotId: string | null | undefined,
  produitId: string,
  typeOperation: 'ENTREE' | 'SORTIE',
  quantite: number,
  prixUnitaire: number | null | undefined
) {
  if (!depotId) {
    throw new Error("Un dépôt est requis pour le calcul du stock");
  }

  const stocksPrecedents = await prisma.stock.findMany({
    where: {
      depotId: depotId,
      produitId: produitId,
    },
    orderBy: { createdAt: 'asc' },
  });

  let stockQuantite = 0;
  let stockValeur = 0;
  let stockPrixUnitaire: number | null = null;

  for (const stock of stocksPrecedents) {
    if (stock.type === 'ENTREE') {
      stockQuantite += stock.quantite;
      if (stock.prixUnitaireAchat != null) {
        stockValeur += stock.quantite * stock.prixUnitaireAchat;
      }
    } else if (stock.type === 'SORTIE') {
      if (stockQuantite > 0) {
        const prixMoyenAvantSortie = stockValeur / stockQuantite;
        stockValeur -= stock.quantite * prixMoyenAvantSortie;
      }
      stockQuantite -= stock.quantite;
    }
    stockPrixUnitaire = stockQuantite > 0 ? stockValeur / stockQuantite : null;
  }

  if (typeOperation === 'ENTREE') {
    const nouvelleQuantite = stockQuantite + quantite;
    const nouvelleValeur = stockValeur + (prixUnitaire != null ? quantite * prixUnitaire : 0);
    const nouveauPrixUnitaire = nouvelleQuantite > 0 ? nouvelleValeur / nouvelleQuantite : null;

    return {
      operationQuantite: quantite,
      operationPrixUnitaire: prixUnitaire,
      operationValeur: prixUnitaire != null ? quantite * prixUnitaire : 0,
      stockQuantiteFinal: nouvelleQuantite,
      stockValeurFinal: nouvelleValeur,
      stockPrixUnitaireFinal: nouveauPrixUnitaire,
    };
  }

  return null;
}

/**
 * @description Creates a new reception in the database.
 * @param parsedInput - The validated input data for the new reception.
 * @returns An object indicating success with the created reception, or failure with an error message.
 */
export const createAction = actionClient
  .schema(CreateReceptionSchema)
  .action(async ({ parsedInput }) => {
    try {
      // Ensure we have a valid accountId
      const account = await prisma.account.findFirst({ select: { id: true } });
      if (!account?.id) {
        return { failure: "Aucun compte utilisateur trouvé. Veuillez vous reconnecter." };
      }

      // Utiliser une transaction pour garantir la cohérence
      const result = await prisma.$transaction(async (tx: any) => {
        // Récupérer depotId et produitId depuis la commande si non fournis
        let depotId = parsedInput.depotId;
        let produitId = parsedInput.produitId;
        let commandeData: { quantite: number; status: string; receptions: Array<{ quantity: number }> } | null = null;

        if (parsedInput.commandeId) {
          const commande = await tx.commande.findUnique({
            where: { id: parsedInput.commandeId },
            select: {
              depotId: true,
              produitId: true,
              quantite: true,
              status: true,
              receptions: {
                where: { receptionStatus: { not: 'CANCELLED' } },
                select: { quantity: true },
              },
            },
          });
          if (commande) {
            depotId = depotId || commande.depotId || null;
            produitId = produitId || commande.produitId || null;
            commandeData = {
              quantite: commande.quantite || 0,
              status: commande.status,
              receptions: commande.receptions,
            };
          }
        }

        // 1. Créer la réception
        const created = await tx.reception.create({
          data: {
            reference: parsedInput.reference,
            receptionDate: parsedInput.receptionDate,
            quantity: parsedInput.quantity,
            unit: parsedInput.unit,
            receptionStatus: parsedInput.receptionStatus,
            commandeId: parsedInput.commandeId,
            depotId: depotId,
            produitId: produitId,
            tankId: parsedInput.tankId,
          },
        });

        // 2. Mettre à jour le stock du dépôt si depotId et produitId sont disponibles
        if (depotId && produitId) {
          // Mettre à jour DepotProduct (quantité totale)
          await tx.depotProduct.upsert({
            where: {
              depotId_productId: {
                depotId: depotId,
                productId: produitId,
              },
            },
            update: {
              quantity: {
                increment: parsedInput.quantity,
              },
            },
            create: {
              depotId: depotId,
              productId: produitId,
              quantity: parsedInput.quantity,
            },
          });

          // Créer une entrée Stock (journal des mouvements) si la réception est RECEIVED
          if (parsedInput.receptionStatus === 'RECEIVED') {
            // Récupérer toutes les données nécessaires en une seule requête
            let prixUnitaire: number | null = null;
            let fournisseurId: string | null = null;
            let devise: 'XOF' | 'USD' | 'EUR' | 'CDF' = 'USD';

            if (parsedInput.commandeId) {
              const commande = await tx.commande.findUnique({
                where: { id: parsedInput.commandeId },
                select: {
                  unitPrice: true,
                  devise: true,
                  fournisseurId: true,
                },
              });
              prixUnitaire = commande?.unitPrice ?? null;
              fournisseurId = commande?.fournisseurId ?? null;
              devise = (commande?.devise || 'USD') as 'XOF' | 'USD' | 'EUR' | 'CDF';
            }

            // Calculer le CMP
            let cmpHint = null;
            try {
              cmpHint = await calculateCMP(
                depotId,
                produitId,
                'ENTREE',
                parsedInput.quantity,
                prixUnitaire
              );
            } catch (error) {
              console.error('Erreur dans le calcul CMP:', error);
              // Continuer même si le calcul CMP échoue
            }

            // Récupérer l'unité depuis le produit
            const produit = await tx.product.findUnique({
              where: { id: produitId },
              select: { unit: true },
            });

            // Créer l'entrée Stock
            await tx.stock.create({
              data: {
                date: parsedInput.receptionDate,
                reference: parsedInput.reference || `Réception ${created.id}`,
                depotId: depotId,
                type: 'ENTREE',
                fournisseurId: fournisseurId,
                clientId: null,
                produitId: produitId,
                quantite: parsedInput.quantity,
                prixUnitaireVente: null,
                prixUnitaireAchat: prixUnitaire,
                unite: produit?.unit || parsedInput.unit as any,
                devise: devise,
                seuilMinimum: 0,
                accountId: account.id,
                // Champs calculés CMP
                valeurEntree: cmpHint?.operationValeur ?? null,
                valeurSortie: null,
                stockQuantiteFinal: cmpHint?.stockQuantiteFinal ?? null,
                stockPrixUnitaireFinal: cmpHint?.stockPrixUnitaireFinal ?? null,
                stockValeurFinal: cmpHint?.stockValeurFinal ?? null,
              },
            });
          }
        }

        // 3. Mettre à jour le statut de la commande si nécessaire
        if (parsedInput.commandeId && commandeData) {
          const totalReceived = commandeData.receptions.reduce((sum, r) => sum + (r.quantity || 0), 0) + parsedInput.quantity;
          const quantiteCommande = commandeData.quantite;

          let newStatus: 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'PARTIALLY_RECEIVED' = commandeData.status as any;
          if (totalReceived >= quantiteCommande) {
            newStatus = 'COMPLETED';
          } else if (totalReceived > 0 && commandeData.status === 'CONFIRMED') {
            newStatus = 'PARTIALLY_RECEIVED';
          }

          if (newStatus !== commandeData.status) {
            await tx.commande.update({
              where: { id: parsedInput.commandeId },
              data: { status: newStatus },
            });
          }
        }

        return created;
      });

      revalidatePath("/dashboard/reception");
      revalidatePath("/dashboard/stocks");
      return { success: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { failure: "Validation failed: " + (error as unknown as { errors: Array<{ message: string }> }).errors.map((e) => e instanceof Error ? e.message : "Erreur inconnue").join(", ") };
      }
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Finds a reception by their unique ID.
 * @param id - The ID of the reception to find.
 * @returns An object indicating success with the found reception, or failure if not found or an error occurs.
 */
export async function findByIdAction(id: string) {
  try {
    if (!id) throw new Error("L'ID du reception est manquant.");
    const result = await prisma.reception.findUnique({ where: { id } });
    if (!result) return { success: false, failure: "Reception non trouvé." };
    return { success: true, result };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

/**
 * @description Retrieves all reception from the database.
 * @returns An object indicating success with the list of reception, or failure if an error occurs.
 */
export const findAllAction = actionClient
  .schema(z.void())
  .action(async () => {
    try {
      const result = await prisma.reception.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return { success: true, result };
    } catch (error) {
      return { success: false, failure: handlePrismaError(error) };
    }
  });

/**
 * @description Updates an existing reception in the database.
 * @param parsedInput - The validated input data for updating the reception, including its ID.
 * @returns An object indicating success with the updated reception, or failure with an error message.
 */
export const updateAction = actionClient
  .schema(ReceptionSchema)
  .action(async ({ parsedInput }) => {
    try {
      // Utiliser une transaction pour garantir la cohérence
      const result = await prisma.$transaction(async (tx: any) => {
        // 1. Récupérer l'ancienne réception pour connaître les valeurs précédentes
        const oldReception = await tx.reception.findUnique({
          where: { id: parsedInput.id },
          select: {
            quantity: true,
            depotId: true,
            produitId: true,
            receptionStatus: true,
            commandeId: true,
          },
        });

        if (!oldReception) {
          throw new Error("Réception introuvable");
        }

        // Récupérer depotId et produitId depuis la commande si non fournis
        let depotId = parsedInput.depotId;
        let produitId = parsedInput.produitId;
        let commandeData: { quantite: number; status: string; receptions: Array<{ quantity: number }> } | null = null;

        if (parsedInput.commandeId) {
          const commande = await tx.commande.findUnique({
            where: { id: parsedInput.commandeId },
            select: {
              depotId: true,
              produitId: true,
              quantite: true,
              status: true,
              receptions: {
                where: {
                  id: { not: parsedInput.id }, // Exclure la réception actuelle
                  receptionStatus: { not: 'CANCELLED' }
                },
                select: { quantity: true },
              },
            },
          });
          if (commande) {
            depotId = depotId || commande.depotId || null;
            produitId = produitId || commande.produitId || null;
            commandeData = {
              quantite: commande.quantite || 0,
              status: commande.status,
              receptions: commande.receptions,
            };
          }
        }

        // 2. Mettre à jour la réception
        const updated = await tx.reception.update({
          where: { id: parsedInput.id },
          data: {
            reference: parsedInput.reference,
            receptionDate: parsedInput.receptionDate,
            quantity: parsedInput.quantity,
            unit: parsedInput.unit,
            receptionStatus: parsedInput.receptionStatus,
            commandeId: parsedInput.commandeId,
            depotId: depotId,
            produitId: produitId,
            tankId: parsedInput.tankId,
          },
        });

        // 3. Mettre à jour les stocks DepotProduct
        // Retirer l'ancienne quantité de l'ancien dépôt/produit (si la réception était RECEIVED)
        if (oldReception.receptionStatus === 'RECEIVED' && oldReception.depotId && oldReception.produitId) {
          await tx.depotProduct.updateMany({
            where: {
              depotId: oldReception.depotId,
              productId: oldReception.produitId,
            },
            data: {
              quantity: {
                decrement: oldReception.quantity,
              },
            },
          });
        }

        // Ajouter la nouvelle quantité au nouveau dépôt/produit (si la réception est RECEIVED)
        if (parsedInput.receptionStatus === 'RECEIVED' && depotId && produitId) {
          await tx.depotProduct.upsert({
            where: {
              depotId_productId: {
                depotId: depotId,
                productId: produitId,
              },
            },
            update: {
              quantity: {
                increment: parsedInput.quantity,
              },
            },
            create: {
              depotId: depotId,
              productId: produitId,
              quantity: parsedInput.quantity,
            },
          });
        }

        // 4. Gérer les entrées Stock (journal des mouvements)
        // Supprimer l'ancienne entrée Stock si elle existait
        if (oldReception.receptionStatus === 'RECEIVED' && oldReception.depotId && oldReception.produitId) {
          const oldStockEntry = await tx.stock.findFirst({
            where: {
              reference: {
                contains: parsedInput.id,
              },
              type: 'ENTREE',
              depotId: oldReception.depotId,
              produitId: oldReception.produitId,
            },
          });

          if (oldStockEntry) {
            await tx.stock.delete({
              where: { id: oldStockEntry.id },
            });
          }
        }

        // Créer une nouvelle entrée Stock si la réception est maintenant RECEIVED
        if (parsedInput.receptionStatus === 'RECEIVED' && depotId && produitId) {
          // Récupérer toutes les données nécessaires
          let prixUnitaire: number | null = null;
          let fournisseurId: string | null = null;
          let devise: 'XOF' | 'USD' | 'EUR' | 'CDF' = 'USD';

          if (parsedInput.commandeId) {
            const commande = await tx.commande.findUnique({
              where: { id: parsedInput.commandeId },
              select: {
                unitPrice: true,
                devise: true,
                fournisseurId: true,
              },
            });
            prixUnitaire = commande?.unitPrice ?? null;
            fournisseurId = commande?.fournisseurId ?? null;
            devise = (commande?.devise || 'USD') as 'XOF' | 'USD' | 'EUR' | 'CDF';
          }

          // Calculer le CMP
          let cmpHint = null;
          try {
            cmpHint = await calculateCMP(
              depotId,
              produitId,
              'ENTREE',
              parsedInput.quantity,
              prixUnitaire
            );
          } catch (error) {
            console.error('Erreur dans le calcul CMP:', error);
          }

          // Récupérer l'unité depuis le produit
          const produit = await tx.product.findUnique({
            where: { id: produitId },
            select: { unit: true },
          });

          // Récupérer l'accountId
          const account = await tx.account.findFirst({ select: { id: true } });

          // Créer l'entrée Stock
          await tx.stock.create({
            data: {
              date: parsedInput.receptionDate,
              reference: parsedInput.reference || `Réception ${parsedInput.id}`,
              depotId: depotId,
              type: 'ENTREE',
              fournisseurId: fournisseurId,
              clientId: null,
              produitId: produitId,
              quantite: parsedInput.quantity,
              prixUnitaireVente: null,
              prixUnitaireAchat: prixUnitaire,
              unite: produit?.unit || parsedInput.unit as any,
              devise: devise,
              seuilMinimum: 0,
              accountId: account?.id ?? undefined,
              // Champs calculés CMP
              valeurEntree: cmpHint?.operationValeur ?? null,
              valeurSortie: null,
              stockQuantiteFinal: cmpHint?.stockQuantiteFinal ?? null,
              stockPrixUnitaireFinal: cmpHint?.stockPrixUnitaireFinal ?? null,
              stockValeurFinal: cmpHint?.stockValeurFinal ?? null,
            },
          });
        }

        // 5. Mettre à jour le statut de la commande si nécessaire
        if (parsedInput.commandeId && commandeData) {
          const totalReceived = commandeData.receptions.reduce((sum, r) => sum + (r.quantity || 0), 0) +
            (parsedInput.receptionStatus === 'RECEIVED' ? parsedInput.quantity : 0);
          const quantiteCommande = commandeData.quantite;

          let newStatus: 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'PARTIALLY_RECEIVED' = commandeData.status as any;
          if (totalReceived >= quantiteCommande) {
            newStatus = 'COMPLETED';
          } else if (totalReceived > 0 && commandeData.status === 'CONFIRMED') {
            newStatus = 'PARTIALLY_RECEIVED';
          } else if (totalReceived === 0) {
            newStatus = 'CONFIRMED';
          }

          if (newStatus !== commandeData.status) {
            await tx.commande.update({
              where: { id: parsedInput.commandeId },
              data: { status: newStatus },
            });
          }
        }

        return updated;
      });

      revalidatePath("/dashboard/reception");
      revalidatePath(`/dashboard/reception/${parsedInput.id}`);
      revalidatePath(`/dashboard/reception/views/${parsedInput.id}`);
      revalidatePath("/dashboard/stocks");
      return { success: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { failure: "Validation failed: " + (error as unknown as { errors: Array<{ message: string }> }).errors.map((e) => e instanceof Error ? e.message : "Erreur inconnue").join(", ") };
      }
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Deletes a reception by their unique ID.
 * @param id - The ID of the reception to delete.
 * @returns An object indicating success with a message, or failure if an error occurs.
 */
export async function removeByIdAction(id: string) {
  try {
    if (!id) throw new Error("L'ID du reception est manquant pour la suppression.");

    // Utiliser une transaction pour garantir la cohérence
    await prisma.$transaction(async (tx: any) => {
      // Récupérer les données de la réception avant suppression
      const existing = await tx.reception.findUnique({
        where: { id },
        select: {
          quantity: true,
          depotId: true,
          produitId: true,
          receptionStatus: true,
          commandeId: true,
        },
      });

      if (!existing) {
        throw new Error("Réception introuvable.");
      }

      // Retirer la quantité du stock DepotProduct si la réception était RECEIVED
      if (existing.receptionStatus === 'RECEIVED' && existing.depotId && existing.produitId) {
        await tx.depotProduct.updateMany({
          where: {
            depotId: existing.depotId,
            productId: existing.produitId,
          },
          data: {
            quantity: {
              decrement: existing.quantity,
            },
          },
        });

        // Supprimer l'entrée Stock correspondante
        const stockEntry = await tx.stock.findFirst({
          where: {
            reference: {
              contains: id,
            },
            type: 'ENTREE',
            depotId: existing.depotId,
            produitId: existing.produitId,
          },
        });

        if (stockEntry) {
          await tx.stock.delete({
            where: { id: stockEntry.id },
          });
        }
      }

      // Mettre à jour le statut de la commande si nécessaire
      if (existing.commandeId) {
        const commande = await tx.commande.findUnique({
          where: { id: existing.commandeId },
          select: {
            quantite: true,
            status: true,
            receptions: {
              where: {
                id: { not: id },
                receptionStatus: { not: 'CANCELLED' }
              },
              select: { quantity: true },
            },
          },
        });

        if (commande) {
          const totalReceived = commande.receptions.reduce((sum: number, r: any) => sum + (r.quantity || 0), 0);
          const quantiteCommande = commande.quantite;

          let newStatus = commande.status;
          if (totalReceived >= quantiteCommande) {
            newStatus = 'COMPLETED';
          } else if (totalReceived > 0 && commande.status === 'CONFIRMED') {
            newStatus = 'PARTIALLY_RECEIVED';
          } else if (totalReceived === 0) {
            newStatus = 'CONFIRMED';
          }

          if (newStatus !== commande.status) {
            await tx.commande.update({
              where: { id: existing.commandeId },
              data: { status: newStatus },
            });
          }
        }
      }

      // Supprimer la réception
      await tx.reception.delete({ where: { id } });
    });

    revalidatePath("/dashboard/reception");
    revalidatePath("/dashboard/stocks");
    return { success: true, message: "Reception supprimé avec succès." };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

/**
 * @description Supprime une réception par son ID via actionClient.
 */
export const deleteReception = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const { id } = parsedInput;

      // Utiliser une transaction pour garantir la cohérence
      await prisma.$transaction(async (tx: any) => {
        // Vérifier si la réception existe et récupérer ses données
        const existing = await tx.reception.findUnique({
          where: { id },
          select: {
            quantity: true,
            depotId: true,
            produitId: true,
            receptionStatus: true,
            commandeId: true,
          },
        });

        if (!existing) {
          throw new Error("Réception introuvable.");
        }

        // Retirer la quantité du stock DepotProduct si la réception était RECEIVED
        if (existing.receptionStatus === 'RECEIVED' && existing.depotId && existing.produitId) {
          await tx.depotProduct.updateMany({
            where: {
              depotId: existing.depotId,
              productId: existing.produitId,
            },
            data: {
              quantity: {
                decrement: existing.quantity,
              },
            },
          });

          // Supprimer l'entrée Stock correspondante
          const stockEntry = await tx.stock.findFirst({
            where: {
              reference: {
                contains: id,
              },
              type: 'ENTREE',
              depotId: existing.depotId,
              produitId: existing.produitId,
            },
          });

          if (stockEntry) {
            await tx.stock.delete({
              where: { id: stockEntry.id },
            });
          }
        }

        // Mettre à jour le statut de la commande si nécessaire
        if (existing.commandeId) {
          const commande = await tx.commande.findUnique({
            where: { id: existing.commandeId },
            select: {
              quantite: true,
              status: true,
              receptions: {
                where: {
                  id: { not: id }, // Exclure la réception supprimée
                  receptionStatus: { not: 'CANCELLED' }
                },
                select: { quantity: true },
              },
            },
          });

          if (commande) {
            const totalReceived = commande.receptions.reduce((sum: number, r: any) => sum + (r.quantity || 0), 0);
            const quantiteCommande = commande.quantite;

            let newStatus = commande.status;
            if (totalReceived >= quantiteCommande) {
              newStatus = 'COMPLETED';
            } else if (totalReceived > 0 && commande.status === 'CONFIRMED') {
              newStatus = 'PARTIALLY_RECEIVED';
            } else if (totalReceived === 0) {
              newStatus = 'CONFIRMED';
            }

            if (newStatus !== commande.status) {
              await tx.commande.update({
                where: { id: existing.commandeId },
                data: { status: newStatus },
              });
            }
          }
        }

        // Supprimer la réception
        await tx.reception.delete({ where: { id } });
      });

      revalidatePath("/dashboard/reception");
      revalidatePath("/dashboard/stocks");
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression de la réception:", error);
      return { failure: error instanceof Error ? error.message : "Impossible de supprimer la réception." };
    }
  });
