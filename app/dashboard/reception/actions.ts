// actions for reception (Prisma)
'use server';

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { handlePrismaError } from "@/middlewares/message_error";
import { CreateReceptionSchema, ReceptionSchema } from "@/models/mvc";
import { z } from "zod";

/**
 * @description Creates a new reception in the database.
 * @param parsedInput - The validated input data for the new reception.
 * @returns An object indicating success with the created reception, or failure with an error message.
 */
export const createAction = actionClient
  .schema(CreateReceptionSchema)
  .action(async ({ parsedInput }) => {
    try {
      // Ensure we have a valid accountId
      const account = await prisma.account.findFirst({ select: { id: true } });
      if (!account?.id) {
        return { failure: "Aucun compte utilisateur trouvé. Veuillez vous reconnecter." };
      }

      // Utiliser une transaction pour garantir la cohérence
      const result = await prisma.$transaction(async (tx) => {
        // Récupérer depotId et produitId depuis la commande si non fournis
        let depotId = parsedInput.depotId;
        let produitId = parsedInput.produitId;
        let commandeData: { quantite: number; status: string; receptions: Array<{ quantity: number }> } | null = null;

        if (parsedInput.commandeId) {
          const commande = await tx.commande.findUnique({
            where: { id: parsedInput.commandeId },
            select: { 
              depotId: true, 
              produitId: true,
              quantite: true,
              status: true,
              receptions: {
                where: { receptionStatus: { not: 'CANCELLED' } },
                select: { quantity: true },
              },
            },
          });
          if (commande) {
            depotId = depotId || commande.depotId || null;
            produitId = produitId || commande.produitId || null;
            commandeData = {
              quantite: commande.quantite || 0,
              status: commande.status,
              receptions: commande.receptions,
            };
          }
        }

        // 1. Créer la réception
        const created = await tx.reception.create({
          data: {
            reference: parsedInput.reference,
            receptionDate: parsedInput.receptionDate,
            quantity: parsedInput.quantity,
            unit: parsedInput.unit,
            receptionStatus: parsedInput.receptionStatus,
            commandeId: parsedInput.commandeId,
            depotId: depotId,
            produitId: produitId,
            tankId: parsedInput.tankId,
          },
        });

        // 2. Mettre à jour le stock du dépôt si depotId et produitId sont disponibles
        if (depotId && produitId) {
          await tx.depotProduct.upsert({
            where: {
              depotId_productId: {
                depotId: depotId,
                productId: produitId,
              },
            },
            update: {
              quantity: {
                increment: parsedInput.quantity,
              },
            },
            create: {
              depotId: depotId,
              productId: produitId,
              quantity: parsedInput.quantity,
            },
          });
        }

        // 3. Mettre à jour le statut de la commande si nécessaire
        if (parsedInput.commandeId && commandeData) {
          const totalReceived = commandeData.receptions.reduce((sum, r) => sum + (r.quantity || 0), 0) + parsedInput.quantity;
          const quantiteCommande = commandeData.quantite;

          let newStatus = commandeData.status;
          if (totalReceived >= quantiteCommande) {
            newStatus = 'COMPLETED';
          } else if (totalReceived > 0 && commandeData.status === 'CONFIRMED') {
            newStatus = 'PARTIALLY_RECEIVED';
          }

          if (newStatus !== commandeData.status) {
            await tx.commande.update({
              where: { id: parsedInput.commandeId },
              data: { status: newStatus },
            });
          }
        }

        return created;
      });

      revalidatePath("/dashboard/reception");
      return { success: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { failure: "Validation failed: " + (error as unknown as { errors: Array<{ message: string }> }).errors.map((e) => e instanceof Error ? e.message : "Erreur inconnue").join(", ") };
      }
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Finds a reception by their unique ID.
 * @param id - The ID of the reception to find.
 * @returns An object indicating success with the found reception, or failure if not found or an error occurs.
 */
export async function findByIdAction(id: string) {
  try {
    if (!id) throw new Error("L'ID du reception est manquant.");
    const result = await prisma.reception.findUnique({ where: { id } });
    if (!result) return { success: false, failure: "Reception non trouvé." };
    return { success: true, result };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

/**
 * @description Retrieves all reception from the database.
 * @returns An object indicating success with the list of reception, or failure if an error occurs.
 */
export const findAllAction = actionClient
  .schema(z.void())
  .action(async () => {
    try {
      const result = await prisma.reception.findMany({ 
        orderBy: { createdAt: 'desc' }
      });
      return { success: true, result };
    } catch (error) {
      return { success: false, failure: handlePrismaError(error) };
    }
  });

/**
 * @description Updates an existing reception in the database.
 * @param parsedInput - The validated input data for updating the reception, including its ID.
 * @returns An object indicating success with the updated reception, or failure with an error message.
 */
export const updateAction = actionClient
  .schema(ReceptionSchema)
  .action(async ({ parsedInput }) => {
    try {
      const result = await prisma.reception.update({
        where: { id: parsedInput.id },
        data: {
          reference: parsedInput.reference,
          receptionDate: parsedInput.receptionDate,
          quantity: parsedInput.quantity,
          unit: parsedInput.unit,
          receptionStatus: parsedInput.receptionStatus,
          commandeId: parsedInput.commandeId,
          depotId: parsedInput.depotId,
          produitId: parsedInput.produitId,
          tankId: parsedInput.tankId,
        },
      });
      revalidatePath("/dashboard/reception");
      revalidatePath(`/dashboard/reception/${parsedInput.id}`);
      revalidatePath(`/dashboard/reception/views/${parsedInput.id}`);
      return { success: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { failure: "Validation failed: " + (error as unknown as { errors: Array<{ message: string }> }).errors.map((e) => e instanceof Error ? e.message : "Erreur inconnue").join(", ") };
      }
      return { failure: handlePrismaError(error) };
    }
  });

/**
 * @description Deletes a reception by their unique ID.
 * @param id - The ID of the reception to delete.
 * @returns An object indicating success with a message, or failure if an error occurs.
 */
export async function removeByIdAction(id: string) {
  try {
    if (!id) throw new Error("L'ID du reception est manquant pour la suppression.");
    
    await prisma.reception.delete({ where: { id } });
    revalidatePath("/dashboard/reception");
    return { success: true, message: "Reception supprimé avec succès." };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

/**
 * @description Supprime une réception par son ID via actionClient.
 */
export const deleteReception = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const { id } = parsedInput;
      
      // Vérifier si la réception existe
      const existing = await prisma.reception.findUnique({ where: { id } });
      if (!existing) {
        return { failure: "Réception introuvable." };
      }
      
      await prisma.reception.delete({ where: { id } });
      revalidatePath("/dashboard/reception");
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression de la réception:", error);
      return { failure: "Impossible de supprimer la réception." };
    }
  });
