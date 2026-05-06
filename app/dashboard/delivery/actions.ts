// actions for delivery (Prisma)
'use server';

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { handlePrismaError } from "@/middlewares/message_error";
import { CreateDeliverySchema, DeliverySchema } from "@/models/mvc";
import { z } from "zod";

function computeDeliveryDerivedValues(input: {
  q20?: number | null;
  qOffloaded?: number | null;
  rate?: number | null;
}) {
  const q20 = Number(input.q20 ?? 0);
  const qOffloaded = Number(input.qOffloaded ?? 0);
  const rate = Number(input.rate ?? 0);
  const varianceQty20 = q20 - qOffloaded;
  const transitAllowableLoss = q20 * 0.003;
  const disAllowableLoss = varianceQty20 - transitAllowableLoss;
  const total = disAllowableLoss * rate;
  return { varianceQty20, transitAllowableLoss, disAllowableLoss, total };
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

async function createDeliveryWithStock(tx: any, parsedInput: z.infer<typeof CreateDeliverySchema>) {
  let cmpWarning: string | null = null;
  const created = await tx.delivery.create({
    data: {
      commandNumber: parsedInput.commandNumber,
      reference: parsedInput.reference,
      deliveryDate: parsedInput.deliveryDate,
      loadingDate: parsedInput.loadingDate,
      dateOffloaded: parsedInput.dateOffloaded,
      departureDate: parsedInput.departureDate,
      etaDate: parsedInput.etaDate,
      ataDate: parsedInput.ataDate,
      quantity: parsedInput.quantity,
      qLoaded: parsedInput.qLoaded,
      qOffloaded: parsedInput.qOffloaded,
      q20: parsedInput.q20,
      temperature: parsedInput.temperature,
      density: parsedInput.density,
      unit: parsedInput.unit,
      truckTrailerNo: parsedInput.truckTrailerNo,
      driverName: parsedInput.driverName,
      truckCapacity: parsedInput.truckCapacity,
      openingEter: parsedInput.openingEter,
      closingEter: parsedInput.closingEter,
      eod: parsedInput.eod,
      prixUnitaire: parsedInput.prixUnitaire,
      paiement: parsedInput.paiement,
      ...computeDeliveryDerivedValues(parsedInput),
      rate: parsedInput.rate,
      typeAircraft: parsedInput.typeAircraft,
      flightNumber: parsedInput.flightNumber,
      note: parsedInput.note,
      remarks: parsedInput.remarks,
      clientId: parsedInput.clientId,
      destinationClientId: parsedInput.destinationClientId,
      transporterId: parsedInput.transporterId,
      depotId: parsedInput.depotId,
      produitId: parsedInput.produitId,
      equipmentId: parsedInput.equipmentId,
    },
  });

  if (parsedInput.depotId && parsedInput.produitId) {
    const sortieQty = parsedInput.qOffloaded ?? parsedInput.quantity;
    await tx.depotProduct.updateMany({
      where: { depotId: parsedInput.depotId, productId: parsedInput.produitId },
      data: { quantity: { decrement: sortieQty } },
    });

    let cmpHint: Awaited<ReturnType<typeof calculateCMP>> | null = null;
    try {
      cmpHint = await calculateCMP(
        parsedInput.depotId,
        parsedInput.produitId,
        "SORTIE",
        sortieQty,
        null
      );
    } catch (error) {
      // Ne bloque pas l'import/creation si le CMP ne peut pas être calculé.
      // La sortie stock est quand même tracée avec valeurs CMP nulles.
      cmpWarning = error instanceof Error ? error.message : "CMP indisponible pour cette sortie";
      console.warn("[delivery] CMP indisponible, sortie enregistrée sans CMP:", error);
    }

    const produit = await tx.product.findUnique({
      where: { id: parsedInput.produitId },
      select: { unit: true },
    });
    const account = await tx.account.findFirst({ select: { id: true } });

    await tx.stock.create({
      data: {
        deliveryId: created.id,
        date: parsedInput.deliveryDate,
        reference: parsedInput.reference || `Livraison ${created.id}`,
        depotId: parsedInput.depotId,
        type: "SORTIE",
        fournisseurId: null,
        clientId: parsedInput.clientId,
        produitId: parsedInput.produitId,
        quantite: sortieQty,
        prixUnitaireVente: parsedInput.prixUnitaire,
        prixUnitaireAchat: cmpHint?.operationPrixUnitaire ?? null,
        unite: produit?.unit || (parsedInput.unit as any),
        devise: "USD",
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

  return { created, cmpWarning };
}

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
      const result = await prisma.$transaction(async (tx: any) => createDeliveryWithStock(tx, parsedInput));

      revalidatePath("/dashboard/delivery");
      revalidatePath("/dashboard/delivery-lbb");
      revalidatePath("/dashboard/stocks");
      revalidatePath("/dashboard/client-orders");
      return {
        success: result.created,
        warning: result.cmpWarning ?? undefined,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { failure: "Validation failed: " + (error as unknown as { errors: Array<{ message: string }> }).errors.map((e) => e instanceof Error ? e.message : "Erreur inconnue").join(", ") };
      }
      return { failure: handlePrismaError(error) };
    }
  });

const DeliveryImportRowSchema = z.object({
  commandNumber: z.string().optional().nullable(),
  truckTrailerNo: z.string().optional().nullable(),
  driverName: z.string().optional().nullable(),
  truckCapacity: z.number().optional().nullable(),
  qLoaded: z.number().optional().nullable(),
  temperature: z.number().optional().nullable(),
  density: z.number().optional().nullable(),
  q20: z.number().optional().nullable(),
  loadingDate: z.string().min(1),
  qOffloaded: z.number().optional().nullable(),
  dateOffloaded: z.string().min(1),
  departureDate: z.string().optional().nullable(),
  etaDate: z.string().optional().nullable(),
  ataDate: z.string().optional().nullable(),
  eod: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  rate: z.number().optional().nullable(),
  clientId: z.string().min(1),
  destinationClientId: z.string().optional().nullable(),
  transporterId: z.string().min(1),
  depotId: z.string().min(1),
  produitId: z.string().min(1),
});

export const importDeliveryRows = actionClient
  .schema(z.array(DeliveryImportRowSchema))
  .action(async ({ parsedInput }) => {
    try {
      console.info("[delivery/import] Début traitement serveur. Lignes reçues:", parsedInput.length);
      const [clients, depots, transporteurs, products] = await Promise.all([
        prisma.client.findMany({ select: { id: true, name: true, company: true } }),
        prisma.depot.findMany({ select: { id: true, name: true } }),
        prisma.transporteur.findMany({ select: { id: true, nom: true } }),
        prisma.product.findMany({ select: { id: true } }),
      ]);
      console.info("[delivery/import] Référentiels chargés:", {
        clients: clients.length,
        depots: depots.length,
        transporteurs: transporteurs.length,
        products: products.length,
      });

      const clientById = new Set(clients.map((c) => c.id));
      const depotById = new Set(depots.map((d) => d.id));
      const transporterById = new Set(transporteurs.map((t) => t.id));
      const productById = new Set(products.map((p) => p.id));

      let imported = 0;
      const errors: Array<{ row: number; error: string }> = [];

      for (let index = 0; index < parsedInput.length; index += 1) {
        const row = parsedInput[index];
        const rowNo = index + 2;
        try {
          if (!clientById.has(row.clientId)) throw new Error("Client introuvable");
          if (row.destinationClientId && !clientById.has(row.destinationClientId)) {
            throw new Error("Destination introuvable");
          }
          if (!depotById.has(row.depotId)) throw new Error("Depot introuvable");
          if (!transporterById.has(row.transporterId)) throw new Error("Transporteur introuvable");
          if (!productById.has(row.produitId)) throw new Error("Produit introuvable");

          const loadingDate = new Date(row.loadingDate);
          const dateOffloaded = new Date(row.dateOffloaded);
          if (Number.isNaN(loadingDate.getTime()) || Number.isNaN(dateOffloaded.getTime())) {
            throw new Error("Dates invalides (loading/offloaded)");
          }

          await prisma.$transaction(async (tx: any) => {
            await createDeliveryWithStock(tx, {
              commandNumber: row.commandNumber || "",
              reference: row.commandNumber || "",
              deliveryDate: dateOffloaded,
              loadingDate,
              dateOffloaded,
              departureDate: row.departureDate ? new Date(row.departureDate) : null,
              etaDate: row.etaDate ? new Date(row.etaDate) : null,
              ataDate: row.ataDate ? new Date(row.ataDate) : null,
              quantity: Number(row.qOffloaded ?? 0),
              qLoaded: Number(row.qLoaded ?? 0),
              qOffloaded: Number(row.qOffloaded ?? 0),
              q20: Number(row.q20 ?? 0),
              temperature: row.temperature ?? null,
              density: row.density ?? null,
              unit: "L",
              truckTrailerNo: row.truckTrailerNo || "",
              driverName: row.driverName || "",
              truckCapacity: row.truckCapacity ?? null,
              openingEter: null,
              closingEter: null,
              eod: row.eod || "",
              prixUnitaire: null,
              paiement: "DIRECT",
              varianceQty20: 0,
              transitAllowableLoss: 0,
              disAllowableLoss: 0,
              rate: Number(row.rate ?? 0),
              total: 0,
              typeAircraft: null,
              flightNumber: null,
              note: null,
              remarks: row.remarks || "",
              timeStart: null,
              timeEnd: null,
              linkDoc: null,
              clientId: row.clientId,
              destinationClientId: row.destinationClientId || null,
              transporterId: row.transporterId,
              depotId: row.depotId,
              produitId: row.produitId,
              equipmentId: null,
            });
          });
          imported += 1;
        } catch (error) {
          console.warn(`[delivery/import] Erreur ligne ${rowNo}:`, error);
          errors.push({ row: rowNo, error: error instanceof Error ? error.message : "Erreur inconnue" });
        }
      }

      if (imported > 0) {
        revalidatePath("/dashboard/delivery");
        revalidatePath("/dashboard/delivery-lbb");
        revalidatePath("/dashboard/client-orders");
      }
      console.info("[delivery/import] Fin traitement:", { imported, errors: errors.length });

      return { success: { imported, errors } };
    } catch (error) {
      console.error("[delivery/import] Erreur globale serveur:", error);
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
            qOffloaded: true,
            depotId: true,
            produitId: true,
          },
        });

        if (!oldDelivery) {
          throw new Error("Livraison introuvable");
        }

        // Retirer l'ancienne quantité du stock si nécessaire
        if (oldDelivery.depotId && oldDelivery.produitId) {
          const oldQty = oldDelivery.qOffloaded ?? oldDelivery.quantity;
          await tx.depotProduct.updateMany({
            where: {
              depotId: oldDelivery.depotId,
              productId: oldDelivery.produitId,
            },
            data: {
              quantity: {
                increment: oldQty,
              },
            },
          });

          // Supprimer l'ancienne entrée Stock
          const oldStockEntry = await tx.stock.findFirst({
            where: {
              OR: [
                { deliveryId: parsedInput.id },
                {
                  reference: {
                    contains: parsedInput.id,
                  },
                },
              ],
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
            commandNumber: parsedInput.commandNumber,
            reference: parsedInput.reference,
            deliveryDate: parsedInput.deliveryDate,
            loadingDate: parsedInput.loadingDate,
            dateOffloaded: parsedInput.dateOffloaded,
            departureDate: parsedInput.departureDate,
            etaDate: parsedInput.etaDate,
            ataDate: parsedInput.ataDate,
            quantity: parsedInput.quantity,
            qLoaded: parsedInput.qLoaded,
            qOffloaded: parsedInput.qOffloaded,
            q20: parsedInput.q20,
            temperature: parsedInput.temperature,
            density: parsedInput.density,
            unit: parsedInput.unit,
            truckTrailerNo: parsedInput.truckTrailerNo,
            driverName: parsedInput.driverName,
            truckCapacity: parsedInput.truckCapacity,
            openingEter: parsedInput.openingEter,
            closingEter: parsedInput.closingEter,
            eod: parsedInput.eod,
            prixUnitaire: parsedInput.prixUnitaire,
            paiement: parsedInput.paiement,
            ...computeDeliveryDerivedValues(parsedInput),
            rate: parsedInput.rate,
            typeAircraft: parsedInput.typeAircraft,
            flightNumber: parsedInput.flightNumber,
            note: parsedInput.note,
            remarks: parsedInput.remarks,
            clientId: parsedInput.clientId,
            destinationClientId: parsedInput.destinationClientId,
            transporterId: parsedInput.transporterId,
            depotId: parsedInput.depotId,
            produitId: parsedInput.produitId,
            equipmentId: parsedInput.equipmentId,
          },
        });

        // Ajouter la nouvelle quantité au stock si nécessaire
        if (parsedInput.depotId && parsedInput.produitId) {
          const sortieQty = parsedInput.qOffloaded ?? parsedInput.quantity;
          // Décrémenter la quantité dans DepotProduct
          await tx.depotProduct.updateMany({
            where: {
              depotId: parsedInput.depotId,
              productId: parsedInput.produitId,
            },
            data: {
              quantity: {
                decrement: sortieQty,
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
              sortieQty,
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
              deliveryId: parsedInput.id,
              date: parsedInput.deliveryDate,
              reference: parsedInput.reference || `Livraison ${parsedInput.id}`,
              depotId: parsedInput.depotId,
              type: 'SORTIE',
              fournisseurId: null,
              clientId: parsedInput.clientId,
              produitId: parsedInput.produitId,
              quantite: sortieQty,
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
      revalidatePath("/dashboard/delivery-lbb");
      revalidatePath(`/dashboard/delivery/${parsedInput.id}`);
      revalidatePath(`/dashboard/delivery/views/${parsedInput.id}`);
      revalidatePath("/dashboard/stocks");
      revalidatePath("/dashboard/client-orders");
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
          qOffloaded: true,
          depotId: true,
          produitId: true,
        },
      });

      if (!existing) {
        throw new Error("Livraison introuvable.");
      }

      // Restaurer la quantité du stock si nécessaire
      if (existing.depotId && existing.produitId) {
        const oldQty = existing.qOffloaded ?? existing.quantity;
        await tx.depotProduct.updateMany({
          where: {
            depotId: existing.depotId,
            productId: existing.produitId,
          },
          data: {
            quantity: {
              increment: oldQty,
            },
          },
        });

        // Supprimer l'entrée Stock correspondante
        const stockEntry = await tx.stock.findFirst({
          where: {
            OR: [
              { deliveryId: id },
              {
                reference: {
                  contains: id,
                },
              },
            ],
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
    revalidatePath("/dashboard/delivery-lbb");
    revalidatePath("/dashboard/stocks");
    revalidatePath("/dashboard/client-orders");
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
            qOffloaded: true,
            depotId: true,
            produitId: true,
          },
        });

        if (!existing) {
          throw new Error("Livraison introuvable.");
        }

        // Restaurer la quantité du stock si nécessaire
        if (existing.depotId && existing.produitId) {
          const oldQty = existing.qOffloaded ?? existing.quantity;
          await tx.depotProduct.updateMany({
            where: {
              depotId: existing.depotId,
              productId: existing.produitId,
            },
            data: {
              quantity: {
                increment: oldQty,
              },
            },
          });

          // Supprimer l'entrée Stock correspondante
          const stockEntry = await tx.stock.findFirst({
            where: {
              OR: [
                { deliveryId: id },
                {
                  reference: {
                    contains: id,
                  },
                },
              ],
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
      revalidatePath("/dashboard/delivery-lbb");
      revalidatePath("/dashboard/stocks");
      revalidatePath("/dashboard/client-orders");
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression de la livraison:", error);
      return { failure: handlePrismaError(error) };
    }
  });
