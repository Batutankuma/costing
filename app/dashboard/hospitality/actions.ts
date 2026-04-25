"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

function getHospitalityMovementReference(hospitalityId: string) {
  return `HOSP-${hospitalityId}`;
}

async function createOrUpdateHospitalityStockMovement(
  tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  params: {
    hospitalityId: string;
    commandeId: string;
    quantity: number;
    movementDate: Date;
    supplierId: string;
  }
) {
  const sourceCommande = await tx.commande.findUnique({
    where: { id: params.commandeId },
    select: {
      depotId: true,
      produitId: true,
      devise: true,
      unitPrice: true,
      fournisseurId: true,
    },
  });

  if (!sourceCommande) {
    throw new Error("Commande source introuvable pour créer le mouvement Hospitality.");
  }

  const produit = await tx.product.findUnique({
    where: { id: sourceCommande.produitId },
    select: { unit: true },
  });
  if (!produit) {
    throw new Error("Produit introuvable pour la commande sélectionnée.");
  }

  const movementReference = getHospitalityMovementReference(params.hospitalityId);
  const movementPayload = {
    date: params.movementDate,
    reference: movementReference,
    type: "ENTREE" as const,
    depotId: sourceCommande.depotId,
    produitId: sourceCommande.produitId,
    quantite: params.quantity,
    unite: produit.unit,
    devise: sourceCommande.devise ?? "USD",
    fournisseurId: params.supplierId || sourceCommande.fournisseurId || null,
    prixUnitaireAchat: sourceCommande.unitPrice,
    seuilMinimum: 0,
    accountId: null,
    clientId: null,
    prixUnitaireVente: null,
  };

  const existingMovement = await tx.stock.findFirst({
    where: { reference: movementReference },
    select: { id: true },
  });

  if (existingMovement) {
    await tx.stock.update({
      where: { id: existingMovement.id },
      data: movementPayload,
    });
    return existingMovement.id;
  }

  const createdMovement = await tx.stock.create({
    data: movementPayload,
    select: { id: true },
  });
  return createdMovement.id;
}

async function deleteHospitalityStockMovement(
  tx: Omit<typeof prisma, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  hospitalityId: string
) {
  const movementReference = getHospitalityMovementReference(hospitalityId);
  const existingMovement = await tx.stock.findFirst({
    where: { reference: movementReference },
    select: { id: true },
  });

  if (!existingMovement) return;
  await tx.stock.delete({ where: { id: existingMovement.id } });
}

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
  commandeId: z.string().min(1, "Commande requise"),
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
        commande: { select: { id: true, reference: true, quantite: true } },
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
        const commande = await tx.commande.findUnique({
          where: { id: parsedInput.commandeId },
          select: { id: true, quantite: true },
        });
        if (!commande) throw new Error("Commande introuvable.");
        if (commande.quantite < parsedInput.offlQty20) {
          throw new Error("Quantité insuffisante sur le bon de commande.");
        }

        const createdHospitality = await tx.hospitality.create({
          data: {
            ...parsedInput,
            stockId: null,
            ...computed,
          },
        });

        await createOrUpdateHospitalityStockMovement(tx, {
          hospitalityId: createdHospitality.id,
          commandeId: parsedInput.commandeId,
          quantity: parsedInput.offlQty20,
          movementDate: parsedInput.entryDate,
          supplierId: parsedInput.supplierId,
        });

        await tx.commande.update({
          where: { id: parsedInput.commandeId },
          data: {
            quantite: {
              decrement: parsedInput.offlQty20,
            },
          },
        });
        return createdHospitality;
      });
      revalidatePath("/dashboard/hospitality");
      revalidatePath("/dashboard/stocks");
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
          select: { offlQty20: true, commandeId: true },
        });
        if (!previous) throw new Error("Entrée hospitality introuvable.");
        if (!previous.commandeId) throw new Error("Cette ligne hospitality n'est liée à aucune commande.");

        const newCommande = await tx.commande.findUnique({
          where: { id: data.commandeId },
          select: { id: true, quantite: true },
        });
        if (!newCommande) throw new Error("Commande introuvable.");

        if (previous.commandeId === data.commandeId) {
          const delta = data.offlQty20 - previous.offlQty20;
          if (delta > 0 && newCommande.quantite < delta) {
            throw new Error("Quantité insuffisante sur le bon de commande.");
          }
        } else if (newCommande.quantite < data.offlQty20) {
          throw new Error("Quantité insuffisante sur le nouveau bon de commande.");
        }

        const updatedHospitality = await tx.hospitality.update({
          where: { id },
          data: {
            ...data,
            stockId: null,
            ...computed,
          },
        });

        await createOrUpdateHospitalityStockMovement(tx, {
          hospitalityId: id,
          commandeId: data.commandeId,
          quantity: data.offlQty20,
          movementDate: data.entryDate,
          supplierId: data.supplierId,
        });

        await tx.commande.update({
          where: { id: previous.commandeId },
          data: { quantite: { increment: previous.offlQty20 } },
        });

        await tx.commande.update({
          where: { id: data.commandeId },
          data: { quantite: { decrement: data.offlQty20 } },
        });

        return updatedHospitality;
      });
      revalidatePath("/dashboard/hospitality");
      revalidatePath(`/dashboard/hospitality/${id}`);
      revalidatePath("/dashboard/stocks");
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
          select: { id: true, commandeId: true, offlQty20: true },
        });
        if (!existing) throw new Error("Entrée hospitality introuvable.");
        if (!existing.commandeId) throw new Error("Cette ligne hospitality n'est liée à aucune commande.");

        await deleteHospitalityStockMovement(tx, existing.id);
        await tx.commande.update({
          where: { id: existing.commandeId },
          data: { quantite: { increment: existing.offlQty20 } },
        });
        await tx.hospitality.delete({ where: { id: parsedInput.id } });
      });
      revalidatePath("/dashboard/hospitality");
      revalidatePath("/dashboard/stocks");
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
  commandeReference: z.string().min(1),
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
      const [suppliers, transporters, depots] = await Promise.all([
        prisma.fournisseur.findMany({ select: { id: true, nom: true } }),
        prisma.transporteur.findMany({ select: { id: true, nom: true } }),
        prisma.depot.findMany({ select: { id: true, name: true } }),
      ]);
      const commandes = await prisma.commande.findMany({
        select: { id: true, reference: true, depotId: true, quantite: true },
      });
      console.info("[hospitality/import] Référentiels chargés:", {
        suppliers: suppliers.length,
        transporters: transporters.length,
        depots: depots.length,
      });

      const supplierByName = new Map(suppliers.map((item) => [normalizeKey(item.nom), item.id]));
      const transporterByName = new Map(transporters.map((item) => [normalizeKey(item.nom), item.id]));
      const depotByName = new Map(depots.map((item) => [normalizeKey(item.name), item.id]));
      const commandeByRef = new Map(commandes.map((item) => [normalizeKey(item.reference), item]));

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

          const commandeReference = row.commandeReference.trim();
          const resolvedCommande = commandeByRef.get(normalizeKey(commandeReference)) ?? null;
          if (!resolvedCommande) throw new Error(`Commande introuvable: ${commandeReference}`);
          if (resolvedCommande.depotId && resolvedCommande.depotId !== depotId) {
            throw new Error(`La commande ${commandeReference} n'appartient pas au depot ${row.depotName}`);
          }
          if (resolvedCommande.quantite < row.offlQty20) {
            throw new Error(`Quantité insuffisante sur la commande ${commandeReference}`);
          }

          const loadingDate = parseDateValue(row.loadingDate, rowNumber, "LOADING DATE");
          const entryDate = parseDateValue(row.entryDate, rowNumber, "ENTRY DATE");
          const offlDate = parseDateValue(row.offlDate, rowNumber, "OFFL DATE");
          const computed = computeValues(row.quantityOrder, row.offlQty20, row.rate);

          await prisma.$transaction(async (tx) => {
            const createdHospitality = await tx.hospitality.create({
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
                stockId: null,
                commandeId: resolvedCommande.id,
                rate: row.rate,
                ...computed,
              },
            });

            await createOrUpdateHospitalityStockMovement(tx, {
              hospitalityId: createdHospitality.id,
              commandeId: resolvedCommande.id,
              quantity: row.offlQty20,
              movementDate: entryDate,
              supplierId,
            });

            await tx.commande.update({
              where: { id: resolvedCommande.id },
              data: { quantite: { decrement: row.offlQty20 } },
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
        revalidatePath("/dashboard/stocks");
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
