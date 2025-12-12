"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  CreateKinshasaCostingSchema,
  UpdateKinshasaCostingSchema,
} from "@/models/mvc.pruned";

const IdSchema = z.object({ id: z.string() });

export async function getKinshasaCostings() {
  try {
    return await prisma.kinshasaCosting.findMany({
      orderBy: { createdAt: "desc" },
      include: { product: true },
    });
  } catch (error) {
    console.error("Erreur lors du chargement des costings Kinshasa:", error);
    return [];
  }
}

export async function getKinshasaCostingById(id: string) {
  try {
    if (!id) return null;
    return await prisma.kinshasaCosting.findUnique({
      where: { id },
      include: { product: true },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du costing:", error);
    return null;
  }
}

export const createKinshasaCosting = actionClient
  .schema(CreateKinshasaCostingSchema)
  .action(async ({ parsedInput }) => {
    try {
      const created = await prisma.kinshasaCosting.create({
        data: {
          title: parsedInput.title,
          description: parsedInput.description,
          productId: parsedInput.productId,
          currency: parsedInput.currency,
          volumeM3: parsedInput.volumeM3,
          unitPriceUsd: parsedInput.unitPriceUsd,
          clientExchangeRate: parsedInput.clientExchangeRate,
          benchmarkExchangeRate: parsedInput.benchmarkExchangeRate,
          engenPriceCDF: parsedInput.engenPriceCDF,
          engenPriceUSD: parsedInput.engenPriceUSD,
          cdfBreakdown: parsedInput.cdfBreakdown,
          usdBreakdown: parsedInput.usdBreakdown,
          notes: parsedInput.notes,
        },
      });
      revalidatePath("/dashboard/kinshasa-costings");
      return { success: created };
    } catch (error) {
      console.error("Erreur création costing Kinshasa:", error);
      return { failure: "Impossible de créer le costing." };
    }
  });

export const updateKinshasaCosting = actionClient
  .schema(UpdateKinshasaCostingSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, ...data } = parsedInput;
      if (!id) return { failure: "ID manquant" };
      const updated = await prisma.kinshasaCosting.update({
        where: { id },
        data: {
          title: data.title ?? undefined,
          description: data.description ?? undefined,
          productId: data.productId ?? undefined,
          currency: data.currency,
          volumeM3: data.volumeM3 ?? undefined,
          unitPriceUsd: data.unitPriceUsd ?? undefined,
          clientExchangeRate: data.clientExchangeRate ?? undefined,
          benchmarkExchangeRate: data.benchmarkExchangeRate ?? undefined,
          engenPriceCDF: data.engenPriceCDF ?? undefined,
          engenPriceUSD: data.engenPriceUSD ?? undefined,
          cdfBreakdown: data.cdfBreakdown,
          usdBreakdown: data.usdBreakdown,
          notes: data.notes ?? undefined,
        },
      });
      revalidatePath("/dashboard/kinshasa-costings");
      revalidatePath(`/dashboard/kinshasa-costings/${id}`);
      revalidatePath(`/dashboard/kinshasa-costings/views/${id}`);
      return { success: updated };
    } catch (error) {
      console.error("Erreur mise à jour costing Kinshasa:", error);
      return { failure: "Impossible de mettre à jour le costing." };
    }
  });

export const deleteKinshasaCosting = actionClient
  .schema(IdSchema)
  .action(async ({ parsedInput }) => {
    try {
      await prisma.kinshasaCosting.delete({ where: { id: parsedInput.id } });
      revalidatePath("/dashboard/kinshasa-costings");
      return { success: true };
    } catch (error) {
      console.error("Erreur suppression costing Kinshasa:", error);
      return { failure: "Impossible de supprimer le costing." };
    }
  });

