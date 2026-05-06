"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { CreateFournisseurSchema, FournisseurSchema } from "@/models/mvc";
import { z } from "zod";

/**
 * @description Liste tous les fournisseurs.
 */
export async function getFournisseurs() {
  try {
    return await prisma.fournisseur.findMany({ 
      orderBy: { createdAt: 'desc' } 
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des fournisseurs:", error);
    return [];
  }
}

/**
 * @description Récupère un fournisseur par son ID.
 */
export async function getFournisseurById(id: string) {
  try {
    if (!id) throw new Error("L'ID du fournisseur est manquant.");
    const result = await prisma.fournisseur.findUnique({ where: { id } });
    if (!result) return null;
    return result;
  } catch (error) {
    console.error("Erreur lors de la récupération du fournisseur:", error);
    return null;
  }
}

/**
 * @description Crée un nouveau fournisseur.
 */
export const createFournisseur = actionClient
  .schema(CreateFournisseurSchema)
  .action(async ({ parsedInput }) => {
    try {
      const account = await prisma.account.findFirst({ select: { id: true } });
      const created = await prisma.fournisseur.create({
        data: {
          nom: parsedInput.company,
          company: parsedInput.company,
          contactName: parsedInput.contactName ?? null,
          email: parsedInput.email || null,
          phone: parsedInput.phone || null,
          rccm: parsedInput.rccm || null,
          idNat: parsedInput.idNat || null,
          nif: parsedInput.nif || null,
          pays: parsedInput.pays || null,
          notes: parsedInput.notes || null,
          adresse: parsedInput.adresse ?? null,
          accountId: account?.id ?? null,
        },
      });
      revalidatePath("/dashboard/fournisseurs");
      return { success: created };
    } catch (error) {
      console.error("Erreur lors de la création du fournisseur:", error);
      return { failure: "Impossible de créer le fournisseur." };
    }
  });

/**
 * @description Met à jour un fournisseur existant.
 */
export const updateFournisseur = actionClient
  .schema(FournisseurSchema)
  .action(async ({ parsedInput }) => {
    try {
      const result = await prisma.fournisseur.update({
        where: { id: parsedInput.id },
        data: {
          nom: parsedInput.company,
          company: parsedInput.company,
          contactName: parsedInput.contactName ?? null,
          email: parsedInput.email || null,
          phone: parsedInput.phone || null,
          rccm: parsedInput.rccm || null,
          idNat: parsedInput.idNat || null,
          nif: parsedInput.nif || null,
          pays: parsedInput.pays || null,
          notes: parsedInput.notes || null,
          adresse: parsedInput.adresse ?? null,
        },
      });
      revalidatePath("/dashboard/fournisseurs");
      revalidatePath(`/dashboard/fournisseurs/${parsedInput.id}`);
      revalidatePath(`/dashboard/fournisseurs/views/${parsedInput.id}`);
      return { success: result };
    } catch (error) {
      console.error("Erreur lors de la mise à jour du fournisseur:", error);
      return { failure: "Impossible de mettre à jour le fournisseur." };
    }
  });

/**
 * @description Supprime un fournisseur par son ID.
 */
export const deleteFournisseur = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const { id } = parsedInput;
      // Vérifier s'il existe des références (commandes ou stocks)
      const [commande, stock] = await Promise.all([
        prisma.commande?.findFirst({ where: { fournisseurId: id }, select: { id: true } }).catch(() => null),
        prisma.stock?.findFirst({ where: { fournisseurId: id }, select: { id: true } }).catch(() => null),
      ]);
      
      if (commande || stock) {
        return { failure: "Impossible de supprimer: le fournisseur est référencé (commandes ou stocks)." };
      }
      
      await prisma.fournisseur.delete({ where: { id } });
      revalidatePath("/dashboard/fournisseurs");
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression du fournisseur:", error);
      return { failure: "Impossible de supprimer le fournisseur." };
    }
  });

