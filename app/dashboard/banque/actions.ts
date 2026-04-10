"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CreateBanqueSchema, BanqueSchema } from "@/models/mvc";
import { handlePrismaError } from "@/middlewares/message_error";

/**
 * @description Crée une nouvelle banque.
 */
export const createBanque = actionClient
  .schema(CreateBanqueSchema)
  .action(async ({ parsedInput }) => {
    try {
      const created = await prisma.banque.create({
        data: parsedInput,
      });
      revalidatePath("/dashboard/banque");
      return { success: created };
    } catch (error) {
      console.error("Erreur lors de la création de la banque:", error);
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Récupère toutes les banques.
 */
export async function getBanques() {
  try {
    return await prisma.banque.findMany({ 
      orderBy: { createdAt: 'desc' } 
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des banques:", error);
    return [];
  }
}

/**
 * @description Récupère toutes les banques via actionClient.
 */
export const findAllBanquesAction = actionClient
  .schema(z.void())
  .action(async () => {
    try {
      const result = await prisma.banque.findMany({ 
        orderBy: { createdAt: 'desc' } 
      });
      return { success: true, result };
    } catch (error) {
      return { success: false, failure: handlePrismaError(error) };
    }
  });

/**
 * @description Récupère une banque par son ID.
 */
export async function getBanqueById(id: string) {
  try {
    if (!id) throw new Error("L'ID de la banque est manquant.");
    const result = await prisma.banque.findUnique({ where: { id } });
    if (!result) return null;
    return result;
  } catch (error) {
    console.error("Erreur lors de la récupération de la banque:", error);
    return null;
  }
}

/**
 * @description Met à jour une banque existante.
 */
export const updateBanque = actionClient
  .schema(BanqueSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, ...data } = parsedInput;
      if (!id) return { failure: "ID manquant" };
      
      const result = await prisma.banque.update({
        where: { id },
        data,
      });
      revalidatePath("/dashboard/banque");
      revalidatePath(`/dashboard/banque/${id}`);
      revalidatePath(`/dashboard/banque/views/${id}`);
      return { success: result };
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la banque:", error);
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Supprime une banque par son ID.
 */
export const deleteBanque = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const { id } = parsedInput;
      
      // Vérifier si la banque existe
      const existing = await prisma.banque.findUnique({ where: { id } });
      if (!existing) {
        return { failure: "Banque introuvable." };
      }
      
      // Vérifier les références
      const [licence, paiement] = await Promise.all([
        prisma.licence.findFirst({ where: { banqueId: id }, select: { id: true } }),
        prisma.paiementBanque.findFirst({ where: { banqueId: id }, select: { id: true } }),
      ]);
      
      if (licence || paiement) {
        return { failure: "Impossible de supprimer: la banque est référencée dans des licences ou paiements." };
      }
      
      await prisma.banque.delete({ where: { id } });
      revalidatePath("/dashboard/banque");
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression de la banque:", error);
      return { failure: "Impossible de supprimer la banque." };
    }
  });
