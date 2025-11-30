"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Server helper for RSC usage
export async function getProducts() {
  try {
    const items = await prisma.product.findMany({ orderBy: { name: "asc" } });
    return items;
  } catch (e) {
    return [] as any[];
  }
}

const CreateProductSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  unit: z.enum([
    "KG",
    "G",
    "L",
    "ML",
    "TONNE",
    "PIECE",
    "BOITE",
    "CAISSON",
    "POUCE",
    "METRE",
    "METRE_CARRE",
    "METRE_CUBE",
    "METRE_LINEAIRE",
  ]),
  code: z.string().optional(),
});

export const listProducts = actionClient.action(async () => {
  const items = await prisma.product.findMany({ orderBy: { name: "asc" } });
  return { data: items };
});

export const getProductById = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const prod = await prisma.product.findUnique({ where: { id: parsedInput.id } });
    if (!prod) return { failure: "Produit introuvable" } as const;
    return { data: prod } as const;
  });

export const createProduct = actionClient
  .schema(CreateProductSchema)
  .action(async ({ parsedInput }) => {
    try {
      const code = (parsedInput.code || "").trim();
      const normalizedCode = code.length ? code : null;
      if (normalizedCode) {
        const exists = await prisma.product.findFirst({ where: { code: normalizedCode } });
        if (exists) return { failure: `Un produit avec le code "${normalizedCode}" existe déjà.` } as const;
      }
      const created = await prisma.product.create({
        data: { name: parsedInput.name, unit: parsedInput.unit as any, code: normalizedCode },
      });
      revalidatePath("/dashboard/products");
      return { success: created } as const;
    } catch (e: any) {
      if (e?.code === "P2002") {
        return { failure: "Le code produit est déjà utilisé. Veuillez choisir un autre code." } as const;
      }
      return { failure: "Impossible de créer le produit." } as const;
    }
  });

export const updateProduct = actionClient
  .schema(CreateProductSchema.extend({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const { id, ...data } = parsedInput as any;
      const code = (data.code || "").trim();
      const normalizedCode = code.length ? code : null;
      if (normalizedCode) {
        const exists = await prisma.product.findFirst({ where: { code: normalizedCode, NOT: { id } } });
        if (exists) return { failure: `Un produit avec le code "${normalizedCode}" existe déjà.` } as const;
      }
      const updated = await prisma.product.update({
        where: { id },
        data: { name: data.name, unit: data.unit as any, code: normalizedCode },
      });
      revalidatePath("/dashboard/products");
      revalidatePath(`/dashboard/products/${id}`);
      revalidatePath(`/dashboard/products/views/${id}`);
      return { success: updated } as const;
    } catch (e: any) {
      if (e?.code === "P2002") {
        return { failure: "Le code produit est déjà utilisé. Veuillez choisir un autre code." } as const;
      }
      return { failure: "Impossible de mettre à jour le produit." } as const;
    }
  });

export const deleteProduct = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    // Supprimer les liens de depot_product avant le produit
    await prisma.$transaction([
      prisma.depotProduct.deleteMany({ where: { productId: parsedInput.id } }),
      prisma.product.delete({ where: { id: parsedInput.id } }),
    ]);
    revalidatePath("/dashboard/products");
    return { success: true };
  });


