"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { handlePrismaError } from "@/middlewares/message_error";
import { z } from "zod";

/**
 * Fonction utilitaire pour calculer le CMP (Coût Moyen Pondéré) pour les sorties
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

  if (typeOperation === 'SORTIE') {
    if (stockQuantite <= 0 || stockPrixUnitaire == null) {
      throw new Error("Stock insuffisant pour effectuer cette sortie");
    }

    const nouvelleQuantite = stockQuantite - quantite;
    if (nouvelleQuantite < 0) {
      throw new Error("Quantité en stock insuffisante");
    }

    const valeurSortie = quantite * stockPrixUnitaire;
    const nouvelleValeur = stockValeur - valeurSortie;
    const nouveauPrixUnitaire = nouvelleQuantite > 0 ? nouvelleValeur / nouvelleQuantite : null;

    return {
      operationQuantite: quantite,
      operationPrixUnitaire: stockPrixUnitaire,
      operationValeur: valeurSortie,
      stockQuantiteFinal: nouvelleQuantite,
      stockValeurFinal: nouvelleValeur,
      stockPrixUnitaireFinal: nouveauPrixUnitaire,
    };
  }

  throw new Error("Type d'opération invalide");
}

// Schéma de validation pour Shipment
const ShipmentSchema = z.object({
  id: z.string().optional(),
  numerobl: z.string().min(1, "Le numéro BL est requis"),
  date: z.date(),
  quantite: z.number().min(0.01, "La quantité doit être supérieure à 0"),
  unite: z.enum(["KG", "G", "L", "ML", "TONNE", "PIECE", "BOITE", "CAISSON", "POUCE", "METRE", "METRE_CARRE", "METRE_CUBE", "METRE_LINEAIRE"]),
  prixUnitaire: z.number().min(0).optional().nullable(),
  description: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  produitId: z.string().min(1, "Le produit est requis"),
  depotId: z.string().optional().nullable(),
});

const CreateShipmentSchema = ShipmentSchema.omit({ id: true });

/**
 * @description Liste tous les shipments.
 */
export async function getShipments() {
  try {
    return await prisma.shipment.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
            company: true,
          },
        },
        produit: {
          select: {
            id: true,
            name: true,
            unit: true,
          },
        },
        depot: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des shipments:", error);
    return [];
  }
}

/**
 * @description Récupère un shipment par son ID.
 */
export async function getShipmentById(id: string) {
  try {
    if (!id) throw new Error("L'ID du shipment est manquant.");
    const result = await prisma.shipment.findUnique({
      where: { id },
      include: {
        client: true,
        produit: true,
        depot: true,
      },
    });
    if (!result) return null;
    return result;
  } catch (error) {
    console.error("Erreur lors de la récupération du shipment:", error);
    return null;
  }
}

/**
 * @description Crée un nouveau shipment.
 */
export const createShipment = actionClient
  .schema(CreateShipmentSchema)
  .action(async ({ parsedInput }) => {
    try {
      // Utiliser une transaction pour garantir la cohérence
      const result = await prisma.$transaction(async (tx: any) => {
        // Créer le shipment
        const created = await tx.shipment.create({
          data: parsedInput,
          include: {
            client: {
              select: {
                id: true,
                name: true,
                company: true,
              },
            },
            produit: {
              select: {
                id: true,
                name: true,
                unit: true,
              },
            },
            depot: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // Mettre à jour le stock si dépôt et produit sont fournis
        if (parsedInput.depotId && parsedInput.produitId) {
          // Décrémenter la quantité dans DepotProduct
          await tx.depotProduct.updateMany({
            where: {
              depotId: parsedInput.depotId,
              productId: parsedInput.produitId,
            },
            data: {
              quantity: {
                decrement: parsedInput.quantite,
              },
            },
          });

          // Calculer le CMP pour la sortie
          let cmpHint = null;
          try {
            cmpHint = await calculateCMP(
              parsedInput.depotId,
              parsedInput.produitId,
              'SORTIE',
              parsedInput.quantite,
              null
            );
          } catch (error) {
            console.error('Erreur dans le calcul CMP:', error);
            throw error;
          }

          // Récupérer l'unité depuis le produit
          const produit = await tx.product.findUnique({
            where: { id: parsedInput.produitId },
            select: { unit: true },
          });

          // Récupérer l'accountId
          const account = await tx.account.findFirst({ select: { id: true } });

          // Créer l'entrée Stock de type SORTIE
          await tx.stock.create({
            data: {
              date: parsedInput.date,
              reference: parsedInput.numerobl || `Shipment ${created.id}`,
              depotId: parsedInput.depotId,
              type: 'SORTIE',
              fournisseurId: null,
              clientId: parsedInput.clientId,
              produitId: parsedInput.produitId,
              quantite: parsedInput.quantite,
              prixUnitaireVente: parsedInput.prixUnitaire,
              prixUnitaireAchat: cmpHint?.operationPrixUnitaire ?? null,
              unite: produit?.unit || parsedInput.unite as any,
              devise: 'USD',
              seuilMinimum: 0,
              accountId: account?.id ?? undefined,
              valeurEntree: null,
              valeurSortie: cmpHint?.operationValeur ?? null,
              stockQuantiteFinal: cmpHint?.stockQuantiteFinal ?? null,
              stockPrixUnitaireFinal: cmpHint?.stockPrixUnitaireFinal ?? null,
              stockValeurFinal: cmpHint?.stockValeurFinal ?? null,
            },
          });
        }

        return created;
      });

      revalidatePath("/dashboard/shipments");
      revalidatePath("/dashboard/stocks");
      return { success: result };
    } catch (error) {
      console.error("Erreur lors de la création du shipment:", error);
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Met à jour un shipment existant.
 */
export const updateShipment = actionClient
  .schema(ShipmentSchema.extend({ id: z.string().min(1, "L'ID est requis") }))
  .action(async ({ parsedInput }) => {
    try {
      const { id, ...data } = parsedInput;
      if (!id) return { failure: "ID manquant" };

      // Utiliser une transaction pour garantir la cohérence
      const result = await prisma.$transaction(async (tx: any) => {
        // Récupérer l'ancien shipment
        const oldShipment = await tx.shipment.findUnique({
          where: { id },
          select: {
            quantite: true,
            depotId: true,
            produitId: true,
          },
        });

        if (!oldShipment) {
          throw new Error("Shipment introuvable");
        }

        // Retirer l'ancienne quantité du stock si nécessaire
        if (oldShipment.depotId && oldShipment.produitId) {
          await tx.depotProduct.updateMany({
            where: {
              depotId: oldShipment.depotId,
              productId: oldShipment.produitId,
            },
            data: {
              quantity: {
                increment: oldShipment.quantite,
              },
            },
          });

          // Supprimer l'ancienne entrée Stock
          const oldStockEntry = await tx.stock.findFirst({
            where: {
              reference: {
                contains: id,
              },
              type: 'SORTIE',
              depotId: oldShipment.depotId,
              produitId: oldShipment.produitId,
            },
          });

          if (oldStockEntry) {
            await tx.stock.delete({
              where: { id: oldStockEntry.id },
            });
          }
        }

        // Mettre à jour le shipment
        const updated = await tx.shipment.update({
          where: { id },
          data,
          include: {
            client: {
              select: {
                id: true,
                name: true,
                company: true,
              },
            },
            produit: {
              select: {
                id: true,
                name: true,
                unit: true,
              },
            },
            depot: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // Ajouter la nouvelle quantité au stock si nécessaire
        if (data.depotId && data.produitId) {
          // Décrémenter la quantité dans DepotProduct
          await tx.depotProduct.updateMany({
            where: {
              depotId: data.depotId,
              productId: data.produitId,
            },
            data: {
              quantity: {
                decrement: data.quantite,
              },
            },
          });

          // Calculer le CMP pour la sortie
          let cmpHint = null;
          try {
            cmpHint = await calculateCMP(
              data.depotId,
              data.produitId,
              'SORTIE',
              data.quantite,
              null
            );
          } catch (error) {
            console.error('Erreur dans le calcul CMP:', error);
            throw error;
          }

          // Récupérer l'unité depuis le produit
          const produit = await tx.product.findUnique({
            where: { id: data.produitId },
            select: { unit: true },
          });

          // Récupérer l'accountId
          const account = await tx.account.findFirst({ select: { id: true } });

          // Créer l'entrée Stock de type SORTIE
          await tx.stock.create({
            data: {
              date: data.date,
              reference: data.numerobl || `Shipment ${id}`,
              depotId: data.depotId,
              type: 'SORTIE',
              fournisseurId: null,
              clientId: data.clientId,
              produitId: data.produitId,
              quantite: data.quantite,
              prixUnitaireVente: data.prixUnitaire,
              prixUnitaireAchat: cmpHint?.operationPrixUnitaire ?? null,
              unite: produit?.unit || data.unite as any,
              devise: 'USD',
              seuilMinimum: 0,
              accountId: account?.id ?? undefined,
              valeurEntree: null,
              valeurSortie: cmpHint?.operationValeur ?? null,
              stockQuantiteFinal: cmpHint?.stockQuantiteFinal ?? null,
              stockPrixUnitaireFinal: cmpHint?.stockPrixUnitaireFinal ?? null,
              stockValeurFinal: cmpHint?.stockValeurFinal ?? null,
            },
          });
        }

        return updated;
      });

      revalidatePath("/dashboard/shipments");
      revalidatePath(`/dashboard/shipments/${id}`);
      revalidatePath(`/dashboard/shipments/views/${id}`);
      revalidatePath("/dashboard/stocks");
      return { success: result };
    } catch (error) {
      console.error("Erreur lors de la mise à jour du shipment:", error);
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Importe plusieurs shipments depuis un fichier Excel/CSV.
 */
export const importShipments = actionClient
  .schema(z.array(z.object({
    numerobl: z.string().min(1),
    date: z.date(),
    quantite: z.number().min(0.01),
    unite: z.enum(["KG", "G", "L", "ML", "TONNE", "PIECE", "BOITE", "CAISSON", "POUCE", "METRE", "METRE_CARRE", "METRE_CUBE", "METRE_LINEAIRE"]),
    prixUnitaire: z.number().min(0).optional().nullable(),
    description: z.string().optional().nullable(),
    clientId: z.string().optional().nullable(),
    produitId: z.string().min(1),
    depotId: z.string().optional().nullable(),
  })))
  .action(async ({ parsedInput }) => {
    try {
      const results = {
        imported: 0,
        errors: [] as Array<{ row: number; error: string }>,
      };

      // Utiliser une transaction pour chaque shipment
      for (let i = 0; i < parsedInput.length; i++) {
        const shipmentData = parsedInput[i];
        try {
          await prisma.$transaction(async (tx: any) => {
            // Créer le shipment
            const created = await tx.shipment.create({
              data: shipmentData,
            });

            // Mettre à jour le stock si dépôt et produit sont fournis
            if (shipmentData.depotId && shipmentData.produitId) {
              // Décrémenter la quantité dans DepotProduct
              await tx.depotProduct.updateMany({
                where: {
                  depotId: shipmentData.depotId,
                  productId: shipmentData.produitId,
                },
                data: {
                  quantity: {
                    decrement: shipmentData.quantite,
                  },
                },
              });

              // Calculer le CMP pour la sortie
              let cmpHint = null;
              try {
                cmpHint = await calculateCMP(
                  shipmentData.depotId,
                  shipmentData.produitId,
                  'SORTIE',
                  shipmentData.quantite,
                  null
                );
              } catch (error) {
                console.error('Erreur dans le calcul CMP:', error);
                throw error;
              }

              // Récupérer l'unité depuis le produit
              const produit = await tx.product.findUnique({
                where: { id: shipmentData.produitId },
                select: { unit: true },
              });

              // Récupérer l'accountId
              const account = await tx.account.findFirst({ select: { id: true } });

              // Créer l'entrée Stock de type SORTIE
              await tx.stock.create({
                data: {
                  date: shipmentData.date,
                  reference: shipmentData.numerobl || `Shipment ${created.id}`,
                  depotId: shipmentData.depotId,
                  type: 'SORTIE',
                  fournisseurId: null,
                  clientId: shipmentData.clientId,
                  produitId: shipmentData.produitId,
                  quantite: shipmentData.quantite,
                  prixUnitaireVente: shipmentData.prixUnitaire,
                  prixUnitaireAchat: cmpHint?.operationPrixUnitaire ?? null,
                  unite: produit?.unit || shipmentData.unite as any,
                  devise: 'USD',
                  seuilMinimum: 0,
                  accountId: account?.id ?? undefined,
                  valeurEntree: null,
                  valeurSortie: cmpHint?.operationValeur ?? null,
                  stockQuantiteFinal: cmpHint?.stockQuantiteFinal ?? null,
                  stockPrixUnitaireFinal: cmpHint?.stockPrixUnitaireFinal ?? null,
                  stockValeurFinal: cmpHint?.stockValeurFinal ?? null,
                },
              });
            }
          });

          results.imported++;
        } catch (error) {
          results.errors.push({
            row: i + 2, // +2 car ligne 1 = en-têtes, et index commence à 0
            error: error instanceof Error ? error.message : "Erreur inconnue"
          });
        }
      }

      revalidatePath("/dashboard/shipments");
      revalidatePath("/dashboard/stocks");
      return { success: results };
    } catch (error) {
      console.error("Erreur lors de l'import des shipments:", error);
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Supprime un shipment par son ID.
 */
export const deleteShipment = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const { id } = parsedInput;

      // Utiliser une transaction pour garantir la cohérence
      await prisma.$transaction(async (tx: any) => {
        // Vérifier si le shipment existe et récupérer ses données
        const existing = await tx.shipment.findUnique({
          where: { id },
          select: {
            quantite: true,
            depotId: true,
            produitId: true,
          },
        });

        if (!existing) {
          throw new Error("Shipment introuvable.");
        }

        // Restaurer la quantité du stock si nécessaire
        if (existing.depotId && existing.produitId) {
          await tx.depotProduct.updateMany({
            where: {
              depotId: existing.depotId,
              productId: existing.produitId,
            },
            data: {
              quantity: {
                increment: existing.quantite,
              },
            },
          });

          // Supprimer l'entrée Stock correspondante
          const stockEntry = await tx.stock.findFirst({
            where: {
              reference: {
                contains: id,
              },
              type: 'SORTIE',
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

        // Supprimer le shipment
        await tx.shipment.delete({ where: { id } });
      });

      revalidatePath("/dashboard/shipments");
      revalidatePath("/dashboard/stocks");
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression du shipment:", error);
      return { failure: handlePrismaError(error) };
    }
  });

