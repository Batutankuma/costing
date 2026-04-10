// actions for delivery (Prisma)
'use server';

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { handlePrismaError } from "@/middlewares/message_error";
import { CreateDeliverySchema, DeliverySchema } from "@/models/mvc";
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

/**
 * @description Creates a new delivery in the database.
 * @param parsedInput - The validated input data for the new delivery.
 * @returns An object indicating success with the created delivery, or failure with an error message.
 */
export const createAction = actionClient
  .schema(CreateDeliverySchema)
  .action(async ({ parsedInput }) => {
    try {
      // Utiliser une transaction pour garantir la cohérence
      const result = await prisma.$transaction(async (tx: any) => {
        // Créer la livraison
        const created = await tx.delivery.create({
          data: {
            reference: parsedInput.reference,
            deliveryDate: parsedInput.deliveryDate,
            quantity: parsedInput.quantity,
            unit: parsedInput.unit,
            openingEter: parsedInput.openingEter,
            closingEter: parsedInput.closingEter,
            prixUnitaire: parsedInput.prixUnitaire,
            paiement: parsedInput.paiement,
            typeAircraft: parsedInput.typeAircraft,
            flightNumber: parsedInput.flightNumber,
            note: parsedInput.note,
            clientId: parsedInput.clientId,
            depotId: parsedInput.depotId,
            produitId: parsedInput.produitId,
            equipmentId: parsedInput.equipmentId,
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
                decrement: parsedInput.quantity,
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
              parsedInput.quantity,
              null // Pour les sorties, le prix vient du stock actuel
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
              date: parsedInput.deliveryDate,
              reference: parsedInput.reference || `Livraison ${created.id}`,
              depotId: parsedInput.depotId,
              type: 'SORTIE',
              fournisseurId: null,
              clientId: parsedInput.clientId,
              produitId: parsedInput.produitId,
              quantite: parsedInput.quantity,
              prixUnitaireVente: parsedInput.prixUnitaire,
              prixUnitaireAchat: cmpHint?.operationPrixUnitaire ?? null,
              unite: produit?.unit || parsedInput.unit as any,
              devise: 'USD', // Par défaut, peut être ajusté selon vos besoins
              seuilMinimum: 0,
              accountId: account?.id ?? undefined,
              // Champs calculés CMP
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

      revalidatePath("/dashboard/delivery");
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
 * @description Finds a delivery by their unique ID.
 * @param id - The ID of the delivery to find.
 * @returns An object indicating success with the found delivery, or failure if not found or an error occurs.
 */
export async function findByIdAction(id: string) {
  try {
    if (!id) throw new Error("L'ID du delivery est manquant.");
    const result = await prisma.delivery.findUnique({ where: { id } });
    if (!result) return { success: false, failure: "Delivery non trouvé." };
    return { success: true, result };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

/**
 * @description Retrieves all delivery from the database.
 * @returns An object indicating success with the list of delivery, or failure if an error occurs.
 */
export const findAllAction = actionClient
  .schema(z.void())
  .action(async () => {
    try {
      const result = await prisma.delivery.findMany({
        orderBy: { createdAt: 'desc' }
      });
      return { success: true, result };
    } catch (error) {
      return { success: false, failure: handlePrismaError(error) };
    }
  });

/**
 * @description Updates an existing delivery in the database.
 * @param parsedInput - The validated input data for updating the delivery, including its ID.
 * @returns An object indicating success with the updated delivery, or failure with an error message.
 */
export const updateAction = actionClient
  .schema(DeliverySchema)
  .action(async ({ parsedInput }) => {
    try {
      // Utiliser une transaction pour garantir la cohérence
      const result = await prisma.$transaction(async (tx: any) => {
        // Récupérer l'ancienne livraison
        const oldDelivery = await tx.delivery.findUnique({
          where: { id: parsedInput.id },
          select: {
            quantity: true,
            depotId: true,
            produitId: true,
          },
        });

        if (!oldDelivery) {
          throw new Error("Livraison introuvable");
        }

        // Retirer l'ancienne quantité du stock si nécessaire
        if (oldDelivery.depotId && oldDelivery.produitId) {
          await tx.depotProduct.updateMany({
            where: {
              depotId: oldDelivery.depotId,
              productId: oldDelivery.produitId,
            },
            data: {
              quantity: {
                increment: oldDelivery.quantity,
              },
            },
          });

          // Supprimer l'ancienne entrée Stock
          const oldStockEntry = await tx.stock.findFirst({
            where: {
              reference: {
                contains: parsedInput.id,
              },
              type: 'SORTIE',
              depotId: oldDelivery.depotId,
              produitId: oldDelivery.produitId,
            },
          });

          if (oldStockEntry) {
            await tx.stock.delete({
              where: { id: oldStockEntry.id },
            });
          }
        }

        // Mettre à jour la livraison
        const updated = await tx.delivery.update({
          where: { id: parsedInput.id },
          data: {
            reference: parsedInput.reference,
            deliveryDate: parsedInput.deliveryDate,
            quantity: parsedInput.quantity,
            unit: parsedInput.unit,
            openingEter: parsedInput.openingEter,
            closingEter: parsedInput.closingEter,
            prixUnitaire: parsedInput.prixUnitaire,
            paiement: parsedInput.paiement,
            typeAircraft: parsedInput.typeAircraft,
            flightNumber: parsedInput.flightNumber,
            note: parsedInput.note,
            clientId: parsedInput.clientId,
            depotId: parsedInput.depotId,
            produitId: parsedInput.produitId,
            equipmentId: parsedInput.equipmentId,
          },
        });

        // Ajouter la nouvelle quantité au stock si nécessaire
        if (parsedInput.depotId && parsedInput.produitId) {
          // Décrémenter la quantité dans DepotProduct
          await tx.depotProduct.updateMany({
            where: {
              depotId: parsedInput.depotId,
              productId: parsedInput.produitId,
            },
            data: {
              quantity: {
                decrement: parsedInput.quantity,
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
              parsedInput.quantity,
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
              date: parsedInput.deliveryDate,
              reference: parsedInput.reference || `Livraison ${parsedInput.id}`,
              depotId: parsedInput.depotId,
              type: 'SORTIE',
              fournisseurId: null,
              clientId: parsedInput.clientId,
              produitId: parsedInput.produitId,
              quantite: parsedInput.quantity,
              prixUnitaireVente: parsedInput.prixUnitaire,
              prixUnitaireAchat: cmpHint?.operationPrixUnitaire ?? null,
              unite: produit?.unit || parsedInput.unit as any,
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

      revalidatePath("/dashboard/delivery");
      revalidatePath(`/dashboard/delivery/${parsedInput.id}`);
      revalidatePath(`/dashboard/delivery/views/${parsedInput.id}`);
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
 * @description Deletes a delivery by their unique ID.
 * @param id - The ID of the delivery to delete.
 * @returns An object indicating success with a message, or failure if an error occurs.
 */
export async function removeByIdAction(id: string) {
  try {
    if (!id) throw new Error("L'ID du delivery est manquant pour la suppression.");

    // Utiliser une transaction pour garantir la cohérence
    await prisma.$transaction(async (tx: any) => {
      // Récupérer les données de la livraison avant suppression
      const existing = await tx.delivery.findUnique({
        where: { id },
        select: {
          quantity: true,
          depotId: true,
          produitId: true,
        },
      });

      if (!existing) {
        throw new Error("Livraison introuvable.");
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
              increment: existing.quantity,
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

      // Supprimer la livraison
      await tx.delivery.delete({ where: { id } });
    });

    revalidatePath("/dashboard/delivery");
    revalidatePath("/dashboard/stocks");
    return { success: true, message: "Delivery supprimé avec succès." };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

/**
 * @description Supprime une livraison par son ID via actionClient.
 */
export const deleteDelivery = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const { id } = parsedInput;

      // Utiliser une transaction pour garantir la cohérence
      await prisma.$transaction(async (tx: any) => {
        // Vérifier si la livraison existe et récupérer ses données
        const existing = await tx.delivery.findUnique({
          where: { id },
          select: {
            quantity: true,
            depotId: true,
            produitId: true,
          },
        });

        if (!existing) {
          throw new Error("Livraison introuvable.");
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
                increment: existing.quantity,
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

        // Supprimer la livraison
        await tx.delivery.delete({ where: { id } });
      });

      revalidatePath("/dashboard/delivery");
      revalidatePath("/dashboard/stocks");
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression de la livraison:", error);
      return { failure: handlePrismaError(error) };
    }
  });
