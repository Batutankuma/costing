"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const TransportRateSchema = z.object({
  id: z.string().optional(),
  destination: z.string().min(1, "Destination requise"),
  rateUsdPerCbm: z.number().min(0, "Le tarif doit être positif"),
});

const CreateTransportRateSchema = TransportRateSchema.omit({ id: true });

/**
 * @description Liste tous les tarifs de transport.
 */
export async function getTransportRates() {
  try {
    return await prisma.transportRate.findMany({ 
      orderBy: { destination: 'asc' } 
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des tarifs:", error);
    return [];
  }
}

/**
 * @description Récupère un tarif de transport par son ID.
 */
export async function getTransportRateById(id: string) {
  try {
    if (!id) throw new Error("L'ID du tarif est manquant.");
    const result = await prisma.transportRate.findUnique({ where: { id } });
    if (!result) return null;
    return result;
  } catch (error) {
    console.error("Erreur lors de la récupération du tarif:", error);
    return null;
  }
}

/**
 * @description Crée un nouveau tarif de transport.
 */
export const createTransportRate = actionClient
  .schema(CreateTransportRateSchema)
  .action(async ({ parsedInput }) => {
    try {
      const created = await prisma.transportRate.create({
        data: {
          destination: parsedInput.destination,
          rateUsdPerCbm: parsedInput.rateUsdPerCbm,
        },
      });
      revalidatePath("/dashboard/transport-rates");
      return { success: created };
    } catch (error) {
      console.error("Erreur lors de la création du tarif:", error);
      return { failure: "Impossible de créer le tarif de transport." };
    }
  });

/**
 * @description Met à jour un tarif de transport existant.
 */
export const updateTransportRate = actionClient
  .schema(TransportRateSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, ...data } = parsedInput;
      if (!id) return { failure: "ID manquant" };
      
      const result = await prisma.transportRate.update({
        where: { id },
        data: {
          destination: data.destination,
          rateUsdPerCbm: data.rateUsdPerCbm,
        },
      });
      revalidatePath("/dashboard/transport-rates");
      revalidatePath(`/dashboard/transport-rates/${id}`);
      revalidatePath(`/dashboard/transport-rates/views/${id}`);
      return { success: result };
    } catch (error) {
      console.error("Erreur lors de la mise à jour du tarif:", error);
      return { failure: "Impossible de mettre à jour le tarif de transport." };
    }
  });

/**
 * @description Supprime un tarif de transport par son ID.
 */
export const deleteTransportRate = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const { id } = parsedInput;
      
      // Vérifier si le tarif existe
      const existing = await prisma.transportRate.findUnique({ where: { id } });
      if (!existing) {
        return { failure: "Tarif de transport introuvable." };
      }
      
      await prisma.transportRate.delete({ where: { id } });
      revalidatePath("/dashboard/transport-rates");
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression du tarif:", error);
      return { failure: "Impossible de supprimer le tarif de transport." };
    }
  });

