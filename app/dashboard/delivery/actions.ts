// actions for delivery (Prisma)
'use server';

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { handlePrismaError } from "@/middlewares/message_error";
import { CreateDeliverySchema, DeliverySchema } from "@/models/mvc";
import { z } from "zod";

/**
 * @description Creates a new delivery in the database.
 * @param parsedInput - The validated input data for the new delivery.
 * @returns An object indicating success with the created delivery, or failure with an error message.
 */
export const createAction = actionClient
  .schema(CreateDeliverySchema)
  .action(async ({ parsedInput }) => {
    try {
      const created = await prisma.delivery.create({
        data: {
          reference: parsedInput.reference,
          deliveryDate: parsedInput.deliveryDate,
          quantity: parsedInput.quantity,
          unit: parsedInput.unit,
          openingEter: parsedInput.openingEter,
          closingEter: parsedInput.closingEter,
          prixUnitaire: parsedInput.prixUnitaire,
          paiement: parsedInput.paiement,
          typeAircraft: parsedInput.typeAircraft,
          flightNumber: parsedInput.flightNumber,
          note: parsedInput.note,
          clientId: parsedInput.clientId,
          depotId: parsedInput.depotId,
          produitId: parsedInput.produitId,
          tankId: parsedInput.tankId,
        },
      });
      revalidatePath("/dashboard/delivery");
      return { success: created };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { failure: "Validation failed: " + (error as unknown as { errors: Array<{ message: string }> }).errors.map((e) => e instanceof Error ? e.message : "Erreur inconnue").join(", ") };
      }
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Finds a delivery by their unique ID.
 * @param id - The ID of the delivery to find.
 * @returns An object indicating success with the found delivery, or failure if not found or an error occurs.
 */
export async function findByIdAction(id: string) {
  try {
    if (!id) throw new Error("L'ID du delivery est manquant.");
    const result = await prisma.delivery.findUnique({ where: { id } });
    if (!result) return { success: false, failure: "Delivery non trouvé." };
    return { success: true, result };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

/**
 * @description Retrieves all delivery from the database.
 * @returns An object indicating success with the list of delivery, or failure if an error occurs.
 */
export const findAllAction = actionClient
  .schema(z.void())
  .action(async () => {
    try {
      const result = await prisma.delivery.findMany({ 
        orderBy: { createdAt: 'desc' }
      });
      return { success: true, result };
    } catch (error) {
      return { success: false, failure: handlePrismaError(error) };
    }
  });

/**
 * @description Updates an existing delivery in the database.
 * @param parsedInput - The validated input data for updating the delivery, including its ID.
 * @returns An object indicating success with the updated delivery, or failure with an error message.
 */
export const updateAction = actionClient
  .schema(DeliverySchema)
  .action(async ({ parsedInput }) => {
    try {
      const result = await prisma.delivery.update({
        where: { id: parsedInput.id },
        data: {
          reference: parsedInput.reference,
          deliveryDate: parsedInput.deliveryDate,
          quantity: parsedInput.quantity,
          unit: parsedInput.unit,
          openingEter: parsedInput.openingEter,
          closingEter: parsedInput.closingEter,
          prixUnitaire: parsedInput.prixUnitaire,
          paiement: parsedInput.paiement,
          typeAircraft: parsedInput.typeAircraft,
          flightNumber: parsedInput.flightNumber,
          note: parsedInput.note,
          clientId: parsedInput.clientId,
          depotId: parsedInput.depotId,
          produitId: parsedInput.produitId,
          tankId: parsedInput.tankId,
        },
      });
      revalidatePath("/dashboard/delivery");
      revalidatePath(`/dashboard/delivery/${parsedInput.id}`);
      revalidatePath(`/dashboard/delivery/views/${parsedInput.id}`);
      return { success: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { failure: "Validation failed: " + (error as unknown as { errors: Array<{ message: string }> }).errors.map((e) => e instanceof Error ? e.message : "Erreur inconnue").join(", ") };
      }
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Deletes a delivery by their unique ID.
 * @param id - The ID of the delivery to delete.
 * @returns An object indicating success with a message, or failure if an error occurs.
 */
export async function removeByIdAction(id: string) {
  try {
    if (!id) throw new Error("L'ID du delivery est manquant pour la suppression.");
    
    await prisma.delivery.delete({ where: { id } });
    revalidatePath("/dashboard/delivery");
    return { success: true, message: "Delivery supprimé avec succès." };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

/**
 * @description Supprime une livraison par son ID via actionClient.
 */
export const deleteDelivery = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const { id } = parsedInput;
      
      // Vérifier si la livraison existe
      const existing = await prisma.delivery.findUnique({ where: { id } });
      if (!existing) {
        return { failure: "Livraison introuvable." };
      }
      
      await prisma.delivery.delete({ where: { id } });
      revalidatePath("/dashboard/delivery");
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression de la livraison:", error);
      return { failure: "Impossible de supprimer la livraison." };
    }
  });
