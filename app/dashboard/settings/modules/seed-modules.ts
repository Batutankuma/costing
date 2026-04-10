"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function seedModules() {
  const modules = [
    { name: "Finance", type: "FINANCE" as const, description: "Module de gestion financière" },
    { name: "CRM", type: "CRM" as const, description: "Module de gestion de la relation client" },
    { name: "Dépôt Autres", type: "DEPOT_AUTRES" as const, description: "Module de gestion du dépôt autres" },
    { name: "Dépôt Kalemie", type: "DEPOT_KALEMIE" as const, description: "Module de gestion du dépôt Kalemie" },
    { name: "Dépôt Lubumbashi", type: "DEPOT_LUBUMBASHI" as const, description: "Module de gestion du dépôt Lubumbashi" },
    { name: "Dépôt Kinshasa", type: "DEPOT_KINSHASA" as const, description: "Module de gestion du dépôt Kinshasa" },
    { name: "Opération", type: "OPERATION" as const, description: "Module de gestion des opérations" },
  ];

  try {
    for (const moduleData of modules) {
      await prisma.module.upsert({
        where: { name: moduleData.name },
        update: {},
        create: {
          name: moduleData.name,
          type: moduleData.type,
          description: moduleData.description,
          isActive: true,
        },
      });
    }
    revalidatePath("/dashboard/settings/modules");
    return { success: true, message: "Modules initialisés avec succès" };
  } catch (error) {
    console.error("Erreur lors de l'initialisation des modules:", error);
    return { success: false, message: "Erreur lors de l'initialisation des modules" };
  }
}
