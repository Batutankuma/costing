// actions for commande
'use server';

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { handlePrismaError } from "@/middlewares/message_error";
import { CreateCommandeSchema, TYPE_FACTURE_OPTIONS } from "@/models/mvc";
import {
  commandeDecimalRefine,
  commandeDecimalsToNumber,
  roundCommandeDecimal,
} from "@/lib/commande-decimals";
import { z } from "zod";

/**
 * @description Creates a new commande in the database.
 * @param parsedInput - The validated input data for the new commande.
 * @returns An object indicating success with the created commande, or failure with an error message.
 */
// Schéma de validation côté serveur (plus flexible pour les IDs)
const ServerCommandeSchema = z.object({
  reference: z.string().min(1, "La référence est requise"),
  status: z.enum(["DRAFT", "CONFIRMED", "PARTIALLY_RECEIVED", "COMPLETED", "CANCELLED"]),
  produitId: z.string().min(1, "Le produit est requis"),
  depotId: z.string().min(1, "Le dépôt est requis"),
  fournisseurId: z.string().min(1, "Le fournisseur est requis"),
  quantity: z
    .number()
    .min(0.0001, "La quantité doit être supérieure à 0")
    .refine(commandeDecimalRefine.check, { message: commandeDecimalRefine.message }),
  unitPrice: z
    .number()
    .min(0.0001, "Le prix unitaire doit être supérieur à 0")
    .refine(commandeDecimalRefine.check, { message: commandeDecimalRefine.message }),
  devise: z.enum(["XOF", "USD", "EUR", "CDF"]),
  typePaiement: z.enum(["DIRECT", "CREDIT"]),
  // Champs facture
  numeroFacture: z.string().optional().nullable(),
  typeFacture: z.enum(TYPE_FACTURE_OPTIONS).optional().nullable(),
  dateFacture: z.date().optional().nullable(),
  tva: z.number().optional().nullable(),
});

export const createAction = actionClient
  .schema(ServerCommandeSchema)
  .action(async ({ parsedInput }) => {
    try {
    
      // Préparer les données avec gestion des valeurs optionnelles
      const commandeData = {
        status: parsedInput.status,
        reference: parsedInput.reference,
        produitId: parsedInput.produitId,
        depotId: parsedInput.depotId,
        devise: parsedInput.devise,
        // Champ Prisma: quantite
        quantite: roundCommandeDecimal(parsedInput.quantity),
        fournisseurId: parsedInput.fournisseurId,
        unitPrice: roundCommandeDecimal(parsedInput.unitPrice),
        // Champs facture
        numeroFacture: parsedInput.numeroFacture ?? null,
        typeFacture: parsedInput.typeFacture ?? null,
        dateFacture: parsedInput.dateFacture ?? null,
        tva: parsedInput.tva != null ? roundCommandeDecimal(parsedInput.tva) : null,
      };
     
      const result = await prisma.commande.create({
        data: commandeData,
        include: {
          produit: { select: { name: true } },
          depot: { select: { name: true } },
          fournisseur: { select: { nom: true } },
        },
      });
     
      revalidatePath("/dashboard/commande");
      return { success: commandeDecimalsToNumber(result) };
    } catch (error) {
      console.error('[CMD-ACTION] error:', error);
      if (error instanceof z.ZodError) {
        return { failure: "Validation failed: " + error.errors.map((e) => e.message).join(", ") };
      }
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Finds a commande by their unique ID.
 * @param id - The ID of the commande to find.
 * @returns An object indicating success with the found commande, or failure if not found or an error occurs.
 */
export async function findByIdAction(id: string) {
  try {
    if (!id) {
      throw new Error("L'ID du commande est manquant.");
    }
    
    const result = await prisma.commande.findUnique({
      where: { id },
      include: {
        produit: { select: { name: true } },
        depot: { select: { name: true } },
        fournisseur: { select: { nom: true } },
        hospitalityRows: { select: { offlQty20: true } },
      },
    });
    
    if (!result) {
      return { success: false, failure: "Commande non trouvé." };
    }
    return { success: true, result: commandeDecimalsToNumber(result) };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

/**
 * @description Retrieves all commande from the database.
 * @returns An object indicating success with the list of commande, or failure if an error occurs.
 */
export const findAllAction = actionClient
  .schema(z.void())
  .action(async () => {
    try {
      const result = await prisma.commande.findMany({
        include: {
          produit: { select: { name: true, unit: true } },
          depot: { select: { name: true } },
          fournisseur: { select: { nom: true } },
          receptions: {
            where: { receptionStatus: { not: 'CANCELLED' } },
            select: { quantity: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      
      // Calculer currentQuantity pour chaque commande
      type CommandeWithReceptions = typeof result[0] & {
        receptions?: Array<{ quantity: number }>;
      };
      const resultWithCurrentQuantity = result.map((commande: CommandeWithReceptions) => {
        const totalReceived = commande.receptions?.reduce((sum: number, r: { quantity: number }) => sum + (r.quantity || 0), 0) || 0;
        const quantite = Number(commande.quantite);
        const currentQuantity = Math.max(0, quantite - totalReceived);
        return {
          ...commandeDecimalsToNumber(commande),
          currentQuantity,
          unit: commande.produit?.unit || 'L',
        };
      });
      
      return { success: true, result: resultWithCurrentQuantity };
    } catch (error) {
      return { success: false, failure: handlePrismaError(error) };
    }
  });

/**
 * @description Updates an existing commande in the database.
 * @param parsedInput - The validated input data for updating the commande, including its ID.
 * @returns An object indicating success with the updated commande, or failure with an error message.
 */
export const updateAction = actionClient
  .schema(CreateCommandeSchema.extend({ id: z.string().min(1, "L'ID est requis") }))
  .action(async ({ parsedInput }) => {
    try {
      const { id, ...updateData } = parsedInput; // Destructurer pour exclure l'ID
      const data = {
        ...updateData,
        quantite: roundCommandeDecimal(updateData.quantite),
        unitPrice:
          updateData.unitPrice != null ? roundCommandeDecimal(updateData.unitPrice) : null,
        tva: updateData.tva != null ? roundCommandeDecimal(updateData.tva) : null,
      };

      const result = await prisma.commande.update({
        where: { id },
        data,
        include: {
          produit: { select: { name: true } },
          depot: { select: { name: true } },
          fournisseur: { select: { nom: true } },
        },
      });
      
      revalidatePath("/dashboard/commande");
      revalidatePath(`/dashboard/commande/${id}`);
      revalidatePath(`/dashboard/commande/views/${id}`);
      return { success: commandeDecimalsToNumber(result) };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { failure: "Validation failed: " + error.errors.map((e) => e.message).join(", ") };
      }
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Deletes a commande by their unique ID.
 * @param id - The ID of the commande to delete.
 * @returns An object indicating success with a message, or failure if an error occurs.
 */
export async function removeByIdAction(id: string) {
  try {
    if (!id) {
      throw new Error("L'ID du commande est manquant pour la suppression.");
    }
    
    await prisma.commande.delete({
      where: { id },
    });
    
    revalidatePath("/dashboard/commande");
    return { success: true, message: "Commande supprimé avec succès." };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

/**
 * @description Supprime une commande par son ID via actionClient.
 */
export const deleteCommande = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const { id } = parsedInput;
      
      // Vérifier si la commande existe
      const existing = await prisma.commande.findUnique({ where: { id } });
      if (!existing) {
        return { failure: "Commande introuvable." };
      }
      
      await prisma.commande.delete({ where: { id } });
      revalidatePath("/dashboard/commande");
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression de la commande:", error);
      return { failure: "Impossible de supprimer la commande." };
    }
  });
