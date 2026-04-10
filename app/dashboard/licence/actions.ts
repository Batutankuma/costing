"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CreateLicenceSchema, LicenceSchema } from "@/models/mvc";
import { handlePrismaError } from "@/middlewares/message_error";

/**
 * @description Crée une nouvelle licence.
 */
export const createLicence = actionClient
  .schema(CreateLicenceSchema)
  .action(async ({ parsedInput }) => {
    try {
      const created = await prisma.licence.create({
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
      revalidatePath("/dashboard/licence");
      return { success: created };
    } catch (error) {
      console.error("Erreur lors de la création de la licence:", error);
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Récupère toutes les licences.
 */
export async function getLicences() {
  try {
    return await prisma.licence.findMany({ 
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
    console.error("Erreur lors de la récupération des licences:", error);
    return [];
  }
}

/**
 * @description Récupère une licence par son ID.
 */
export async function getLicenceById(id: string) {
  try {
    if (!id) throw new Error("L'ID de la licence est manquant.");
    const result = await prisma.licence.findUnique({ 
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
    console.error("Erreur lors de la récupération de la licence:", error);
    return null;
  }
}

/**
 * @description Met à jour une licence existante.
 */
export const updateLicence = actionClient
  .schema(LicenceSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, ...data } = parsedInput;
      if (!id) return { failure: "ID manquant" };
      
      const result = await prisma.licence.update({
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
      revalidatePath("/dashboard/licence");
      revalidatePath(`/dashboard/licence/${id}`);
      revalidatePath(`/dashboard/licence/views/${id}`);
      return { success: result };
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la licence:", error);
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Supprime une licence par son ID.
 */
export const deleteLicence = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const { id } = parsedInput;
      
      const existing = await prisma.licence.findUnique({ where: { id } });
      if (!existing) {
        return { failure: "Licence introuvable." };
      }
      
      await prisma.licence.delete({ where: { id } });
      revalidatePath("/dashboard/licence");
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression de la licence:", error);
      return { failure: "Impossible de supprimer la licence." };
    }
  });
