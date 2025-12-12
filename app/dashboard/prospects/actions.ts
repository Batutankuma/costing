"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ProspectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nom requis"),
  company: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  stage: z.enum(["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"]).default("NEW"),
  notes: z.string().optional().nullable(),
});

const CreateProspectSchema = ProspectSchema.omit({ id: true });

/**
 * @description Liste tous les prospects.
 */
export async function getProspects() {
  try {
    return await prisma.prospect.findMany({ 
      orderBy: { createdAt: 'desc' } 
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des prospects:", error);
    return [];
  }
}

/**
 * @description Récupère un prospect par son ID.
 */
export async function getProspectById(id: string) {
  try {
    if (!id) throw new Error("L'ID du prospect est manquant.");
    const result = await prisma.prospect.findUnique({ where: { id } });
    if (!result) return null;
    return result;
  } catch (error) {
    console.error("Erreur lors de la récupération du prospect:", error);
    return null;
  }
}

/**
 * @description Crée un nouveau prospect.
 */
export const createProspect = actionClient
  .schema(CreateProspectSchema)
  .action(async ({ parsedInput }) => {
    try {
      const created = await prisma.prospect.create({
        data: parsedInput,
      });
      revalidatePath("/dashboard/prospects");
      return { success: created };
    } catch (error) {
      console.error("Erreur lors de la création du prospect:", error);
      return { failure: "Impossible de créer le prospect." };
    }
  });

/**
 * @description Met à jour un prospect existant.
 */
export const updateProspect = actionClient
  .schema(ProspectSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, ...data } = parsedInput;
      if (!id) return { failure: "ID manquant" };
      
      const result = await prisma.prospect.update({
        where: { id },
        data,
      });
      revalidatePath("/dashboard/prospects");
      revalidatePath(`/dashboard/prospects/${id}`);
      revalidatePath(`/dashboard/prospects/views/${id}`);
      return { success: result };
    } catch (error) {
      console.error("Erreur lors de la mise à jour du prospect:", error);
      return { failure: "Impossible de mettre à jour le prospect." };
    }
  });

/**
 * @description Supprime un prospect par son ID.
 */
export const deleteProspect = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const { id } = parsedInput;
      
      // Vérifier si le prospect existe
      const existing = await prisma.prospect.findUnique({ where: { id } });
      if (!existing) {
        return { failure: "Prospect introuvable." };
      }
      
      await prisma.prospect.delete({ where: { id } });
      revalidatePath("/dashboard/prospects");
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression du prospect:", error);
      return { failure: "Impossible de supprimer le prospect." };
    }
  });
