"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { handlePrismaError } from "@/middlewares/message_error";
import { CreateUserModuleSchema } from "@/models/mvc.pruned";
import { z } from "zod";

export const assignModulesToUserAction = actionClient
  .schema(CreateUserModuleSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { userId, moduleIds } = parsedInput;

      // Valider les entrées
      if (!userId || typeof userId !== 'string') {
        return { failure: "L'ID de l'utilisateur est invalide." };
      }

      if (!Array.isArray(moduleIds) || moduleIds.length === 0) {
        // Si aucun module n'est sélectionné, supprimer tous les modules existants
        await prisma.userModule.deleteMany({
          where: { userId }
        });
        revalidatePath("/dashboard/settings/users-modules");
        revalidatePath(`/dashboard/users/${userId}`);
        return { success: true };
      }

      // Filtrer les IDs invalides
      const validModuleIds = moduleIds.filter(id => id && typeof id === 'string' && id.trim() !== '');

      // Vérifier que les modules existent
      const existingModules = await prisma.module.findMany({
        where: { id: { in: validModuleIds } },
        select: { id: true }
      });

      const existingModuleIds = existingModules.map(m => m.id);
      const invalidIds = validModuleIds.filter(id => !existingModuleIds.includes(id));

      if (invalidIds.length > 0) {
        return { failure: `Les modules suivants n'existent pas: ${invalidIds.join(', ')}` };
      }

      // Supprimer les modules existants pour cet utilisateur
      await prisma.userModule.deleteMany({
        where: { userId }
      });

      // Créer les nouvelles associations seulement si on a des modules valides
      if (existingModuleIds.length > 0) {
        await prisma.userModule.createMany({
          data: existingModuleIds.map(moduleId => ({
            userId,
            moduleId,
          })),
        });
      }

      revalidatePath("/dashboard/settings/users-modules");
      revalidatePath(`/dashboard/users/${userId}`);
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de l'attribution des modules:", error);
      return { failure: handlePrismaError(error) };
    }
  });

export async function getUserModulesAction(userId: string) {
  try {
    if (!userId) throw new Error("L'ID de l'utilisateur est manquant.");
    const result = await prisma.userModule.findMany({
      where: { userId },
      include: {
        module: true,
      },
    });
    return { success: true, result };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

export async function getAllModulesForSelectionAction() {
  try {
    const result = await prisma.module.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return { success: true, result };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

export const getAllModulesForSelection = actionClient
  .schema(z.void())
  .action(async () => {
    try {
      const result = await prisma.module.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });
      return { success: true, result };
    } catch (error) {
      return { success: false, failure: handlePrismaError(error) };
    }
  });
