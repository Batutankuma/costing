"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ProspectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nom requis"),
  company: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  stage: z.enum(["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"]).default("NEW"),
  notes: z.string().optional().nullable(),
  // Champs de qualification
  jobTitle: z.string().optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  potentialValue: z.number().min(0).optional().nullable(),
  expectedCloseDate: z.union([z.date(), z.string()]).optional().nullable().transform((val) => {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'string') {
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  }),
  tags: z.array(z.string()).default([]),
  ownerId: z.string().optional().nullable(),
});

const CreateProspectSchema = ProspectSchema.omit({ id: true });

/**
 * @description Liste tous les prospects.
 */
export async function getProspects() {
  try {
    return await prisma.prospect.findMany({ 
      include: {
        owner: {
          select: {
            id: true,
            name: true,
          }
        }
      },
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
    const result = await prisma.prospect.findUnique({ 
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });
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
      const { email, website, ...rest } = parsedInput;
      const created = await prisma.prospect.create({
        data: {
          ...rest,
          email: email === "" ? null : email,
          website: website === "" ? null : website,
        },
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
      const { id, email, website, ...rest } = parsedInput;
      if (!id) return { failure: "ID manquant" };
      
      const result = await prisma.prospect.update({
        where: { id },
        data: {
          ...rest,
          email: email === "" ? null : email,
          website: website === "" ? null : website,
        },
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

/**
 * @description Récupère la liste des utilisateurs pour l'assignation de propriétaire.
 */
export async function getUsers() {
  try {
    return await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    return [];
  }
}
