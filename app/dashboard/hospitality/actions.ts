"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const HospitalitySchema = z.object({
  id: z.string().optional(),
  driverName: z.string().min(1, "Driver name requis"),
  supplierId: z.string().min(1, "Supplier requis"),
  transporterId: z.string().min(1, "Transporter requis"),
  truckNo: z.string().min(1, "Truck No. requis"),
  trailerNo: z.string().min(1, "Trailer No. requis"),
  loadingDate: z.date(),
  entryDate: z.date(),
  offlDate: z.date(),
  quantityOrder: z.number().nonnegative(),
  actualQuantity20L: z.number().nonnegative(),
  offlQtyObs: z.number().nonnegative(),
  offlQty20: z.number().nonnegative(),
  depotId: z.string().min(1, "Depot requis"),
  stockId: z.string().min(1, "Stock requis"),
  rate: z.number().nonnegative(),
});

const CreateHospitalitySchema = HospitalitySchema.omit({ id: true });

function computeValues(quantityOrder: number, offlQty20: number, rate: number) {
  const varianceQty20 = quantityOrder - offlQty20;
  const transitAllowableLoss = quantityOrder * 0.003;
  const disAllowableLoss = varianceQty20 - transitAllowableLoss;
  const total = disAllowableLoss * rate;
  return { varianceQty20, transitAllowableLoss, disAllowableLoss, total };
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

function resolveByName(
  inputName: string,
  items: Array<{ id: string; name: string }>
) {
  const normalizedInput = normalizeKey(inputName);
  const exact = items.find((item) => normalizeKey(item.name) === normalizedInput);
  if (exact) return exact;

  const fuzzy = items.filter((item) => {
    const normalizedItem = normalizeKey(item.name);
    return normalizedItem.includes(normalizedInput) || normalizedInput.includes(normalizedItem);
  });

  if (fuzzy.length === 1) return fuzzy[0];
  return null;
}

function parseDateValue(value: string, row: number, field: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Ligne ${row}: date invalide pour ${field}`);
  }
  return date;
}

export async function getHospitalityById(id: string) {
  try {
    if (!id) throw new Error("L'ID est manquant.");
    return await prisma.hospitality.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, nom: true } },
        transporter: { select: { id: true, nom: true } },
        depot: { select: { id: true, name: true } },
        stock: { select: { id: true, reference: true } },
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de hospitality:", error);
    return null;
  }
}

export const createHospitality = actionClient
  .schema(CreateHospitalitySchema)
  .action(async ({ parsedInput }) => {
    try {
      const computed = computeValues(parsedInput.quantityOrder, parsedInput.offlQty20, parsedInput.rate);
      const created = await prisma.$transaction(async (tx) => {
        const createdHospitality = await tx.hospitality.create({
          data: {
            ...parsedInput,
            ...computed,
          },
        });
        await tx.stock.update({
          where: { id: parsedInput.stockId },
          data: {
            quantite: {
              increment: parsedInput.offlQty20,
            },
          },
        });
        return createdHospitality;
      });
      revalidatePath("/dashboard/hospitality");
      return { success: created };
    } catch (error) {
      console.error("Erreur lors de la création de hospitality:", error);
      return { failure: "Impossible de créer l'entrée hospitality." };
    }
  });

export const updateHospitality = actionClient
  .schema(HospitalitySchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, ...data } = parsedInput;
      if (!id) return { failure: "ID manquant" };
      const computed = computeValues(data.quantityOrder, data.offlQty20, data.rate);
      const result = await prisma.$transaction(async (tx) => {
        const previous = await tx.hospitality.findUnique({
          where: { id },
          select: { stockId: true, offlQty20: true },
        });
        if (!previous) {
          throw new Error("Entrée hospitality introuvable.");
        }

        // Revert old qty from previous stock
        await tx.stock.update({
          where: { id: previous.stockId },
          data: {
            quantite: {
              decrement: previous.offlQty20,
            },
          },
        });

        // Apply new qty to selected stock
        await tx.stock.update({
          where: { id: data.stockId },
          data: {
            quantite: {
              increment: data.offlQty20,
            },
          },
        });

        return tx.hospitality.update({
          where: { id },
          data: {
            ...data,
            ...computed,
          },
        });
      });
      revalidatePath("/dashboard/hospitality");
      revalidatePath(`/dashboard/hospitality/${id}`);
      return { success: result };
    } catch (error) {
      console.error("Erreur lors de la mise à jour de hospitality:", error);
      return { failure: "Impossible de mettre à jour l'entrée hospitality." };
    }
  });

export const deleteHospitality = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.hospitality.findUnique({
          where: { id: parsedInput.id },
          select: { stockId: true, offlQty20: true },
        });
        if (!existing) {
          throw new Error("Entrée hospitality introuvable.");
        }
        await tx.stock.update({
          where: { id: existing.stockId },
          data: {
            quantite: {
              decrement: existing.offlQty20,
            },
          },
        });
        await tx.hospitality.delete({ where: { id: parsedInput.id } });
      });
      revalidatePath("/dashboard/hospitality");
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression de hospitality:", error);
      return { failure: "Impossible de supprimer l'entrée hospitality." };
    }
  });

const HospitalityImportRowSchema = z.object({
  driverName: z.string().min(1),
  supplierName: z.string().min(1),
  transporterName: z.string().min(1),
  depotName: z.string().min(1),
  stockReference: z.string().optional().default(""),
  truckNo: z.string().min(1),
  trailerNo: z.string().min(1),
  loadingDate: z.string().min(1),
  entryDate: z.string().min(1),
  offlDate: z.string().min(1),
  quantityOrder: z.number().nonnegative(),
  actualQuantity20L: z.number().nonnegative(),
  offlQtyObs: z.number().nonnegative(),
  offlQty20: z.number().nonnegative(),
  rate: z.number().nonnegative(),
});

export const importHospitalityRows = actionClient
  .schema(z.array(HospitalityImportRowSchema))
  .action(async ({ parsedInput }) => {
    try {
      console.info("[hospitality/import] Début traitement serveur. Lignes reçues:", parsedInput.length);
      const [suppliers, transporters, depots, stocks] = await Promise.all([
        prisma.fournisseur.findMany({ select: { id: true, nom: true } }),
        prisma.transporteur.findMany({ select: { id: true, nom: true } }),
        prisma.depot.findMany({ select: { id: true, name: true } }),
        prisma.stock.findMany({ select: { id: true, reference: true, depotId: true } }),
      ]);
      console.info("[hospitality/import] Référentiels chargés:", {
        suppliers: suppliers.length,
        transporters: transporters.length,
        depots: depots.length,
        stocks: stocks.length,
      });

      const supplierByName = new Map(suppliers.map((item) => [normalizeKey(item.nom), item.id]));
      const transporterByName = new Map(transporters.map((item) => [normalizeKey(item.nom), item.id]));
      const depotByName = new Map(depots.map((item) => [normalizeKey(item.name), item.id]));
      const stockByRef = new Map(stocks.map((item) => [normalizeKey(item.reference), item]));

      if (stocks.length === 0) {
        console.warn("[hospitality/import] Aucun stock trouvé en base.");
      }

      const errors: Array<{ row: number; error: string }> = [];
      let imported = 0;

      for (let index = 0; index < parsedInput.length; index += 1) {
        const rowNumber = index + 2;
        const row = parsedInput[index];
        try {
          const supplierResolved =
            supplierByName.get(normalizeKey(row.supplierName)) ??
            resolveByName(
              row.supplierName,
              suppliers.map((item) => ({ id: item.id, name: item.nom }))
            )?.id;
          const supplierId = supplierResolved;
          if (!supplierId) throw new Error(`Supplier introuvable: ${row.supplierName}`);

          const transporterResolved =
            transporterByName.get(normalizeKey(row.transporterName)) ??
            resolveByName(
              row.transporterName,
              transporters.map((item) => ({ id: item.id, name: item.nom }))
            )?.id;
          const transporterId = transporterResolved;
          if (!transporterId) throw new Error(`Transporter introuvable: ${row.transporterName}`);

          const depotResolved =
            depotByName.get(normalizeKey(row.depotName)) ??
            resolveByName(
              row.depotName,
              depots.map((item) => ({ id: item.id, name: item.name }))
            )?.id;
          const depotId = depotResolved;
          if (!depotId) throw new Error(`Depot introuvable: ${row.depotName}`);

          let resolvedStock = null as (typeof stocks)[number] | null;
          const stockReference = row.stockReference?.trim() ?? "";
          if (stockReference) {
            resolvedStock = stockByRef.get(normalizeKey(stockReference)) ?? null;
            if (!resolvedStock) throw new Error(`Stock introuvable: ${stockReference}`);
            if (resolvedStock.depotId && resolvedStock.depotId !== depotId) {
              throw new Error(`Le stock ${stockReference} n'appartient pas au depot ${row.depotName}`);
            }
          } else {
            const stocksForDepot = stocks.filter((item) => item.depotId === depotId);
            if (stocksForDepot.length === 0) {
              throw new Error(`Aucun stock trouvé pour le depot ${row.depotName}`);
            }
            if (stocksForDepot.length > 1) {
              throw new Error(`Plusieurs stocks existent pour ${row.depotName}, renseignez la colonne Stock`);
            }
            resolvedStock = stocksForDepot[0];
          }

          const loadingDate = parseDateValue(row.loadingDate, rowNumber, "LOADING DATE");
          const entryDate = parseDateValue(row.entryDate, rowNumber, "ENTRY DATE");
          const offlDate = parseDateValue(row.offlDate, rowNumber, "OFFL DATE");
          const computed = computeValues(row.quantityOrder, row.offlQty20, row.rate);

          await prisma.$transaction(async (tx) => {
            await tx.hospitality.create({
              data: {
                driverName: row.driverName,
                supplierId,
                transporterId,
                truckNo: row.truckNo,
                trailerNo: row.trailerNo,
                loadingDate,
                entryDate,
                offlDate,
                quantityOrder: row.quantityOrder,
                actualQuantity20L: row.actualQuantity20L,
                offlQtyObs: row.offlQtyObs,
                offlQty20: row.offlQty20,
                depotId,
                stockId: resolvedStock.id,
                rate: row.rate,
                ...computed,
              },
            });

            await tx.stock.update({
              where: { id: resolvedStock.id },
              data: { quantite: { increment: row.offlQty20 } },
            });
          });

          imported += 1;
        } catch (error) {
          console.warn(`[hospitality/import] Erreur ligne ${rowNumber}:`, error);
          errors.push({
            row: rowNumber,
            error: error instanceof Error ? error.message : "Erreur inconnue",
          });
        }
      }

      if (imported > 0) {
        revalidatePath("/dashboard/hospitality");
      }
      console.info("[hospitality/import] Fin traitement:", {
        imported,
        errors: errors.length,
      });

      return {
        success: {
          imported,
          errors,
        },
      };
    } catch (error) {
      console.error("Erreur lors de l'import hospitality:", error);
      return { failure: "Impossible d'importer le fichier hospitality." };
    }
  });
