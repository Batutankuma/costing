// actions for fournisseur (Prisma)
'use server';

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { handlePrismaError } from "@/middlewares/message_error";
import { CreateFournisseurSchema, FournisseurSchema } from "@/models/mvc";
import { z } from "zod";

/**
 * @description Creates a new fournisseur in the database.
 * @param parsedInput - The validated input data for the new fournisseur.
 * @returns An object indicating success with the created fournisseur, or failure with an error message.
 */
export const createAction = actionClient
  .schema(CreateFournisseurSchema)
  .action(async ({ parsedInput }) => {
    try {
      const account = await prisma.account.findFirst({ select: { id: true } });
      if (!account?.id) {
        throw new Error("Aucun compte trouvé pour créer le fournisseur");
      }
      const created = await prisma.fournisseur.create({
        data: {
          nom: parsedInput.nom,
          company: parsedInput.company ?? null,
          email: parsedInput.email && parsedInput.email !== "" ? parsedInput.email : null,
          phone: parsedInput.phone ?? null,
          adresse: parsedInput.adresse ?? null,
          rccm: parsedInput.rccm ?? null,
          idNat: parsedInput.idNat ?? null,
          nif: parsedInput.nif ?? null,
          pays: parsedInput.pays ?? null,
          notes: parsedInput.notes ?? null,
          accountId: account.id,
        },
      });
      revalidatePath("/dashboard/crm/fournisseur");
      return { success: created };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { failure: "Validation failed: " + (error as unknown as { errors: Array<{ message: string }> }).errors.map((e) => e instanceof Error ? e.message : "Erreur inconnue").join(", ") };
      }
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Finds a fournisseur by their unique ID.
 * @param id - The ID of the fournisseur to find.
 * @returns An object indicating success with the found fournisseur, or failure if not found or an error occurs.
 */
export async function findByIdAction(id: string) {
  try {
    if (!id) throw new Error("L'ID du fournisseur est manquant.");
    const result = await prisma.fournisseur.findUnique({ where: { id } });
    if (!result) return { success: false, failure: "Fournisseur non trouvé." };
    return { success: true, result };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

/**
 * @description Retrieves all fournisseur from the database.
 * @returns An object indicating success with the list of fournisseur, or failure if an error occurs.
 */
export const findAllAction = actionClient
  .schema(z.void())
  .action(async () => {
    try {
      const result = await prisma.fournisseur.findMany({ orderBy: { createdAt: 'desc' } });
      return { success: true, result };
    } catch (error) {
      return { success: false, failure: handlePrismaError(error) };
    }
  });

/**
 * @description Updates an existing fournisseur in the database.
 * @param parsedInput - The validated input data for updating the fournisseur, including its ID.
 * @returns An object indicating success with the updated fournisseur, or failure with an error message.
 */
export const updateAction = actionClient
  .schema(FournisseurSchema)
  .action(async ({ parsedInput }) => {
    try {
      const result = await prisma.fournisseur.update({
        where: { id: parsedInput.id },
        data: {
          nom: parsedInput.nom,
          company: parsedInput.company ?? null,
          email: parsedInput.email && parsedInput.email !== "" ? parsedInput.email : null,
          phone: parsedInput.phone ?? null,
          adresse: parsedInput.adresse ?? null,
          rccm: parsedInput.rccm ?? null,
          idNat: parsedInput.idNat ?? null,
          nif: parsedInput.nif ?? null,
          pays: parsedInput.pays ?? null,
          notes: parsedInput.notes ?? null,
        },
      });
      revalidatePath("/dashboard/crm/fournisseur");
      revalidatePath(`/dashboard/crm/fournisseur/${parsedInput.id}`);
      revalidatePath(`/dashboard/crm/fournisseur/views/${parsedInput.id}`);
      return { success: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { failure: "Validation failed: " + (error as unknown as { errors: Array<{ message: string }> }).errors.map((e) => e instanceof Error ? e.message : "Erreur inconnue").join(", ") };
      }
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Deletes a fournisseur by their unique ID.
 * @param id - The ID of the fournisseur to delete.
 * @returns An object indicating success with a message, or failure if an error occurs.
 */
export async function removeByIdAction(id: string) {
  try {
    if (!id) throw new Error("L'ID du fournisseur est manquant pour la suppression.");
    const [cmd, stock] = await Promise.all([
      prisma.commande.findFirst({ where: { fournisseurId: id }, select: { id: true } }),
      prisma.stock.findFirst({ where: { fournisseurId: id }, select: { id: true } }),
    ]);
    if (cmd || stock) {
      return { success: false, failure: "Impossible de supprimer: le fournisseur est référencé (commandes ou stocks)." };
    }
    await prisma.fournisseur.delete({ where: { id } });
    revalidatePath("/dashboard/crm/fournisseur");
    return { success: true, message: "Fournisseur supprimé avec succès." };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

/**
 * @description Supprime un fournisseur par son ID via actionClient.
 */
export const deleteFournisseurCRM = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const { id } = parsedInput;
      
      // Vérifier les références
      const [cmd, stock] = await Promise.all([
        prisma.commande.findFirst({ where: { fournisseurId: id }, select: { id: true } }),
        prisma.stock.findFirst({ where: { fournisseurId: id }, select: { id: true } }),
      ]);
      
      if (cmd || stock) {
        return { failure: "Impossible de supprimer: le fournisseur est référencé dans des commandes ou stocks." };
      }
      
      await prisma.fournisseur.delete({ where: { id } });
      revalidatePath("/dashboard/crm/fournisseur");
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression du fournisseur:", error);
      return { failure: "Impossible de supprimer le fournisseur." };
    }
  });
