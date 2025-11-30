"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Schemas alignés au Prisma actuel
const ProductInputSchema = z.object({
  name: z.string().min(1),
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
  quantity: z.number().min(0).default(0),
});

const CreateDepotSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  type: z.enum(["OWNED", "EXTERNAL"]).default("OWNED"),
  location: z.string().optional(),
  products: z.array(ProductInputSchema).min(1, "Au moins un produit est requis"),
});

const UpdateDepotSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  type: z.enum(["OWNED", "EXTERNAL"]),
  location: z.string().optional().nullable(),
});

export const listDepots = actionClient.action(async () => {
  const items = await prisma.depot.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      products: { include: { product: true } },
    },
  });
  return { data: items };
});

export const getDepotById = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const depot = await prisma.depot.findUnique({
      where: { id: parsedInput.id },
      include: { products: { include: { product: true } } },
    });
    if (!depot) return { failure: "Dépôt introuvable" } as const;
    return { data: depot } as const;
  });

// Helper RSC direct (évite next-safe-action si besoin dans des pages serveur)
export async function getDepotFull(id: string) {
  try {
    const depot = await prisma.depot.findUnique({
      where: { id },
      include: { products: { include: { product: true } } },
    });
    return depot;
  } catch {
    return null;
  }
}

export const createDepot = actionClient
  .schema(CreateDepotSchema)
  .action(async ({ parsedInput }) => {
    const { name, type, location, products } = parsedInput;
    const productRecords = await Promise.all(
      products.map(async (p) => {
        const existing = await prisma.product.findFirst({ where: { name: p.name, unit: p.unit as any } });
        if (existing) return { productId: existing.id, quantity: p.quantity };
        const created = await prisma.product.create({ data: { name: p.name, unit: p.unit as any } });
        return { productId: created.id, quantity: p.quantity };
      })
    );

    const createdDepot = await prisma.depot.create({
      data: {
        name,
        type: type as any,
        location: location ?? null,
        products: {
          create: productRecords.map((r) => ({ productId: r.productId, quantity: r.quantity })),
        },
      },
      include: { products: { include: { product: true } } },
    });

    revalidatePath("/dashboard/depots");
    return { success: createdDepot };
  });

export const updateDepot = actionClient
  .schema(UpdateDepotSchema)
  .action(async ({ parsedInput }) => {
    const { id, name, type, location } = parsedInput;
    const updated = await prisma.depot.update({
      where: { id },
      data: { name, type: type as any, location: location ?? null },
    });
    revalidatePath("/dashboard/depots");
    revalidatePath(`/dashboard/depots/${id}`);
    revalidatePath(`/dashboard/depots/views/${id}`);
    return { success: updated };
  });

export const deleteDepot = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    await prisma.$transaction([
      prisma.depotProduct.deleteMany({ where: { depotId: parsedInput.id } }),
      prisma.depot.delete({ where: { id: parsedInput.id } }),
    ]);
    revalidatePath("/dashboard/depots");
    return { success: true };
  });

// Met à jour la liste des produits liés (remplacement complet par l'état fourni)
export const updateDepotProducts = actionClient
  .schema(z.object({
    depotId: z.string(),
    items: z.array(z.object({ productId: z.string(), quantity: z.number().min(0) })).default([]),
  }))
  .action(async ({ parsedInput }) => {
    const { depotId, items } = parsedInput;
    // récupérer les liens existants
    const existing = await prisma.depotProduct.findMany({ where: { depotId }, select: { id: true, productId: true } });
    const keepIds = new Set(items.map(i => i.productId));

    await prisma.$transaction([
      // supprimer les liens absents
      prisma.depotProduct.deleteMany({ where: { depotId, productId: { notIn: Array.from(keepIds) } } }),
      // upsert pour chaque item fourni
      ...items.map(i => prisma.depotProduct.upsert({
        where: { depotId_productId: { depotId, productId: i.productId } },
        update: { quantity: i.quantity },
        create: { depotId, productId: i.productId, quantity: i.quantity },
      })),
    ]);

    revalidatePath("/dashboard/depots");
    return { success: true };
  });
