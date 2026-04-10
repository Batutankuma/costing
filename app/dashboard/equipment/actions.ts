// actions for equipment (Prisma)
'use server';

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { handlePrismaError } from "@/middlewares/message_error";
import { CreateEquipmentSchema, EquipmentSchema } from "@/models/mvc";
import { z } from "zod";

/**
 * @description Creates a new equipment in the database.
 * @param parsedInput - The validated input data for the new equipment.
 * @returns An object indicating success with the created equipment, or failure with an error message.
 */
export const createAction = actionClient
  .schema(CreateEquipmentSchema)
  .action(async ({ parsedInput }) => {
    try {
      // Ensure we have a valid accountId
      const account = await prisma.account.findFirst({ select: { id: true } });
      if (!account?.id) {
        return { failure: "Aucun compte utilisateur trouvé. Veuillez vous reconnecter." };
      }

      const created = await prisma.equipment.create({
        data: {
          name: parsedInput.name,
          capacity: parsedInput.capacity,
          currentLevel: parsedInput.currentLevel ?? 0,
          unit: parsedInput.unit,
          depotId: parsedInput.depotId,
          produitId: parsedInput.produitId,
          accountId: account.id,
        },
      });
      revalidatePath("/dashboard/equipment");
      return { success: created };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { failure: "Validation failed: " + (error as unknown as { errors: Array<{ message: string }> }).errors.map((e) => e instanceof Error ? e.message : "Erreur inconnue").join(", ") };
      }
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Finds an equipment by their unique ID.
 * @param id - The ID of the equipment to find.
 * @returns An object indicating success with the found equipment, or failure if not found or an error occurs.
 */
export async function findByIdAction(id: string) {
  try {
    if (!id) throw new Error("L'ID de l'équipement est manquant.");
    const result = await prisma.equipment.findUnique({ 
      where: { id },
      include: {
        depot: true,
        produit: true
      }
    });
    if (!result) return { success: false, failure: "Équipement non trouvé." };
    return { success: true, result };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

/**
 * @description Retrieves all equipment from the database.
 * @returns An object indicating success with the list of equipment, or failure if an error occurs.
 */
export const findAllAction = actionClient
  .schema(z.void())
  .action(async () => {
    try {
      const result = await prisma.equipment.findMany({ 
        orderBy: { createdAt: 'desc' },
        include: {
          depot: true,
          produit: true
        }
      });
      return { success: true, result };
    } catch (error) {
      return { success: false, failure: handlePrismaError(error) };
    }
  });

/**
 * @description Updates an existing equipment in the database.
 * @param parsedInput - The validated input data for updating the equipment, including its ID.
 * @returns An object indicating success with the updated equipment, or failure with an error message.
 */
export const updateAction = actionClient
  .schema(EquipmentSchema)
  .action(async ({ parsedInput }) => {
    try {
      const result = await prisma.equipment.update({
        where: { id: parsedInput.id },
        data: {
          name: parsedInput.name,
          capacity: parsedInput.capacity,
          currentLevel: parsedInput.currentLevel,
          unit: parsedInput.unit,
          depotId: parsedInput.depotId,
          produitId: parsedInput.produitId,
        },
      });
      revalidatePath("/dashboard/equipment");
      revalidatePath(`/dashboard/equipment/${parsedInput.id}`);
      revalidatePath(`/dashboard/equipment/views/${parsedInput.id}`);
      return { success: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { failure: "Validation failed: " + (error as unknown as { errors: Array<{ message: string }> }).errors.map((e) => e instanceof Error ? e.message : "Erreur inconnue").join(", ") };
      }
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Deletes an equipment by their unique ID.
 * @param id - The ID of the equipment to delete.
 * @returns An object indicating success with a message, or failure if an error occurs.
 */
export async function removeByIdAction(id: string) {
  try {
    if (!id) throw new Error("L'ID de l'équipement est manquant pour la suppression.");
    
    await prisma.equipment.delete({ where: { id } });
    revalidatePath("/dashboard/equipment");
    return { success: true, message: "Équipement supprimé avec succès." };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

/**
 * @description Supprime un équipement par son ID via actionClient (pour compatibilité avec delete dialog).
 */
export const deleteEquipment = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const { id } = parsedInput;
      
      // Vérifier si l'équipement existe
      const existing = await prisma.equipment.findUnique({ where: { id } });
      if (!existing) {
        return { failure: "Équipement introuvable." };
      }
      
      await prisma.equipment.delete({ where: { id } });
      revalidatePath("/dashboard/equipment");
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression de l'équipement:", error);
      return { failure: "Impossible de supprimer l'équipement." };
    }
  });
