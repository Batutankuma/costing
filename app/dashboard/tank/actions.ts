// actions for tank (Prisma)
'use server';

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { handlePrismaError } from "@/middlewares/message_error";
import { CreateTankSchema, TankSchema } from "@/models/mvc";
import { z } from "zod";

/**
 * @description Creates a new tank in the database.
 * @param parsedInput - The validated input data for the new tank.
 * @returns An object indicating success with the created tank, or failure with an error message.
 */
export const createAction = actionClient
  .schema(CreateTankSchema)
  .action(async ({ parsedInput }) => {
    try {
      // Ensure we have a valid accountId
      const account = await prisma.account.findFirst({ select: { id: true } });
      if (!account?.id) {
        return { failure: "Aucun compte utilisateur trouvé. Veuillez vous reconnecter." };
      }

      const created = await prisma.tank.create({
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
      revalidatePath("/dashboard/tank");
      return { success: created };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { failure: "Validation failed: " + (error as unknown as { errors: Array<{ message: string }> }).errors.map((e) => e instanceof Error ? e.message : "Erreur inconnue").join(", ") };
      }
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Finds a tank by their unique ID.
 * @param id - The ID of the tank to find.
 * @returns An object indicating success with the found tank, or failure if not found or an error occurs.
 */
export async function findByIdAction(id: string) {
  try {
    if (!id) throw new Error("L'ID du tank est manquant.");
    const result = await prisma.tank.findUnique({ 
      where: { id },
      include: {
        depot: true,
        produit: true
      }
    });
    if (!result) return { success: false, failure: "Tank non trouvé." };
    return { success: true, result };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

/**
 * @description Retrieves all tank from the database.
 * @returns An object indicating success with the list of tank, or failure if an error occurs.
 */
export const findAllAction = actionClient
  .schema(z.void())
  .action(async () => {
    try {
      const result = await prisma.tank.findMany({ 
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
 * @description Updates an existing tank in the database.
 * @param parsedInput - The validated input data for updating the tank, including its ID.
 * @returns An object indicating success with the updated tank, or failure with an error message.
 */
export const updateAction = actionClient
  .schema(TankSchema)
  .action(async ({ parsedInput }) => {
    try {
      const result = await prisma.tank.update({
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
      revalidatePath("/dashboard/tank");
      revalidatePath(`/dashboard/tank/${parsedInput.id}`);
      revalidatePath(`/dashboard/tank/views/${parsedInput.id}`);
      return { success: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { failure: "Validation failed: " + (error as unknown as { errors: Array<{ message: string }> }).errors.map((e) => e instanceof Error ? e.message : "Erreur inconnue").join(", ") };
      }
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Deletes a tank by their unique ID.
 * @param id - The ID of the tank to delete.
 * @returns An object indicating success with a message, or failure if an error occurs.
 */
export async function removeByIdAction(id: string) {
  try {
    if (!id) throw new Error("L'ID du tank est manquant pour la suppression.");
    
    await prisma.tank.delete({ where: { id } });
    revalidatePath("/dashboard/tank");
    return { success: true, message: "Tank supprimé avec succès." };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

/**
 * @description Supprime un tank par son ID via actionClient (pour compatibilité avec delete dialog).
 */
export const deleteTank = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const { id } = parsedInput;
      
      // Vérifier si le tank existe
      const existing = await prisma.tank.findUnique({ where: { id } });
      if (!existing) {
        return { failure: "Tank introuvable." };
      }
      
      await prisma.tank.delete({ where: { id } });
      revalidatePath("/dashboard/tank");
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression du tank:", error);
      return { failure: "Impossible de supprimer le tank." };
    }
  });
