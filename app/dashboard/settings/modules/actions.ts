"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { handlePrismaError } from "@/middlewares/message_error";
import { CreateModuleSchema, ModuleSchema } from "@/models/mvc.pruned";
import { z } from "zod";

export const createModuleAction = actionClient
  .schema(CreateModuleSchema)
  .action(async ({ parsedInput }) => {
    try {
      const created = await prisma.module.create({
        data: {
          name: parsedInput.name,
          type: parsedInput.type,
          description: parsedInput.description ?? null,
          isActive: parsedInput.isActive,
        },
      });
      revalidatePath("/dashboard/settings/modules");
      return { success: created };
    } catch (error) {
      return { failure: handlePrismaError(error) };
    }
  });

export async function findModuleByIdAction(id: string) {
  try {
    if (!id) throw new Error("L'ID du module est manquant.");
    const result = await prisma.module.findUnique({ 
      where: { id },
      include: {
        userModules: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      }
    });
    if (!result) return { success: false, failure: "Module non trouvé." };
    return { success: true, result };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

export const findAllModulesAction = actionClient
  .schema(z.void())
  .action(async () => {
    try {
      const result = await prisma.module.findMany({ 
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              userModules: true
            }
          }
        }
      });
      return { success: true, result };
    } catch (error) {
      return { success: false, failure: handlePrismaError(error) };
    }
  });

export const updateModuleAction = actionClient
  .schema(ModuleSchema)
  .action(async ({ parsedInput }) => {
    try {
      const result = await prisma.module.update({
        where: { id: parsedInput.id },
        data: {
          name: parsedInput.name,
          type: parsedInput.type,
          description: parsedInput.description ?? null,
          isActive: parsedInput.isActive,
        },
      });
      revalidatePath("/dashboard/settings/modules");
      revalidatePath(`/dashboard/settings/modules/${parsedInput.id}`);
      return { success: result };
    } catch (error) {
      return { failure: handlePrismaError(error) };
    }
  });

export const deleteModuleAction = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const { id } = parsedInput;
      
      // Vérifier si le module est utilisé
      const userModuleCount = await prisma.userModule.count({
        where: { moduleId: id }
      });
      
      if (userModuleCount > 0) {
        return { failure: `Impossible de supprimer: ce module est attribué à ${userModuleCount} utilisateur(s).` };
      }
      
      await prisma.module.delete({ where: { id } });
      revalidatePath("/dashboard/settings/modules");
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression du module:", error);
      return { failure: "Impossible de supprimer le module." };
    }
  });
