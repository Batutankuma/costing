"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CreatePaiementBanqueSchema, PaiementBanqueSchema } from "@/models/mvc";
import { handlePrismaError } from "@/middlewares/message_error";

/**
 * @description Crée un nouveau paiement banque.
 */
export const createPaiementBanque = actionClient
  .schema(CreatePaiementBanqueSchema)
  .action(async ({ parsedInput }) => {
    try {
      const created = await prisma.paiementBanque.create({
        data: parsedInput,
        include: {
          commande: {
            select: { reference: true, id: true }
          },
          banque: {
            select: { nom: true, id: true }
          }
        }
      });
      revalidatePath("/dashboard/paiement-banque");
      return { success: created };
    } catch (error) {
      console.error("Erreur lors de la création du paiement banque:", error);
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Récupère tous les paiements banque.
 */
export async function getPaiementBanques() {
  try {
    return await prisma.paiementBanque.findMany({ 
      include: {
        commande: {
          select: { reference: true, id: true }
        },
        banque: {
          select: { nom: true, id: true }
        }
      },
      orderBy: { createdAt: 'desc' } 
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des paiements banque:", error);
    return [];
  }
}

/**
 * @description Récupère un paiement banque par son ID.
 */
export async function getPaiementBanqueById(id: string) {
  try {
    if (!id) throw new Error("L'ID du paiement banque est manquant.");
    const result = await prisma.paiementBanque.findUnique({ 
      where: { id },
      include: {
        commande: {
          select: { reference: true, id: true }
        },
        banque: {
          select: { nom: true, id: true }
        }
      }
    });
    if (!result) return null;
    return result;
  } catch (error) {
    console.error("Erreur lors de la récupération du paiement banque:", error);
    return null;
  }
}

/**
 * @description Met à jour un paiement banque existant.
 */
export const updatePaiementBanque = actionClient
  .schema(PaiementBanqueSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, ...data } = parsedInput;
      if (!id) return { failure: "ID manquant" };
      
      const result = await prisma.paiementBanque.update({
        where: { id },
        data,
        include: {
          commande: {
            select: { reference: true, id: true }
          },
          banque: {
            select: { nom: true, id: true }
          }
        }
      });
      revalidatePath("/dashboard/paiement-banque");
      revalidatePath(`/dashboard/paiement-banque/${id}`);
      revalidatePath(`/dashboard/paiement-banque/views/${id}`);
      return { success: result };
    } catch (error) {
      console.error("Erreur lors de la mise à jour du paiement banque:", error);
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Supprime un paiement banque par son ID.
 */
export const deletePaiementBanque = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const { id } = parsedInput;
      
      const existing = await prisma.paiementBanque.findUnique({ where: { id } });
      if (!existing) {
        return { failure: "Paiement banque introuvable." };
      }
      
      await prisma.paiementBanque.delete({ where: { id } });
      revalidatePath("/dashboard/paiement-banque");
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression du paiement banque:", error);
      return { failure: "Impossible de supprimer le paiement banque." };
    }
  });
