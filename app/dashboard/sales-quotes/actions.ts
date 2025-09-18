"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { z } from "zod";

const CreateQuoteSchema = z.object({
  costBuildUpId: z.string().cuid(),
  userId: z.string(),
  clientId: z.string().optional().nullable(),
  baseDDUUSD: z.number().nonnegative(),
  baseDDPUSD: z.number().nonnegative(),
  marginUSD: z.number().nonnegative().default(0),
  freightToMineUSD: z.number().nonnegative().default(0),
  totalDDUUSD: z.number().nonnegative(),
  totalDDPUSD: z.number().nonnegative(),
  description: z.string().optional().nullable(),
  signatureDataUrl: z.string().optional().nullable(),
  proformaNumber: z.string().optional().nullable(),
  tvaApplicable: z.boolean().optional().default(false),
  tvaAmount: z.number().optional().nullable(),
});

export const createQuote = actionClient
  .schema(CreateQuoteSchema)
  .action(async ({ parsedInput }) => {
    const q = await prisma.salesQuote.create({
      data: {
        costBuildUpId: parsedInput.costBuildUpId,
        userId: parsedInput.userId,
        baseDDUUSD: parsedInput.baseDDUUSD,
        baseDDPUSD: parsedInput.baseDDPUSD,
        marginUSD: parsedInput.marginUSD,
        freightToMineUSD: parsedInput.freightToMineUSD,
        totalDDUUSD: parsedInput.totalDDUUSD,
        totalDDPUSD: parsedInput.totalDDPUSD,
        description: parsedInput.description ?? null,
        // Store signature data URL in a text field if it exists in schema
        ...(parsedInput.signatureDataUrl ? { signatureDataUrl: parsedInput.signatureDataUrl } : {}),
        proformaNumber: parsedInput.proformaNumber ?? null,
        tvaApplicable: parsedInput.tvaApplicable ?? false,
        tvaAmount: parsedInput.tvaAmount ?? 0,
      },
    });
    // Save signature on user profile if provided
    if (parsedInput.signatureDataUrl) {
      try {
        await prisma.user.update({ where: { id: parsedInput.userId }, data: { signatureDataUrl: parsedInput.signatureDataUrl } });
      } catch {}
    }
    // Try to link client if schema supports it; ignore if unknown
    try {
      const cid = (parsedInput as any).clientId as string | undefined;
      if (cid) {
        await (prisma as any).salesQuote.update({ where: { id: q.id }, data: { client: { connect: { id: cid } } } });
      }
    } catch {}
    return { success: true, result: q };
  });

export const listQuotes = actionClient
  .schema(z.object({ userId: z.string().optional().nullable() }).optional())
  .action(async ({ parsedInput }) => {
    const where = parsedInput?.userId ? { userId: parsedInput.userId } : {};
    const items = await prisma.salesQuote.findMany({
      where: where as any,
      include: { costBuildUp: { include: { totals: true, transport: true, supplierDDU: true } }, user: true, client: true },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, result: items };
  });

export const getQuoteById = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const quote = await prisma.salesQuote.findUnique({
      where: { id: parsedInput.id },
      include: {
        user: true,
        client: true,
        costBuildUp: { include: { totals: true, transport: true, supplierDDU: true } },
      },
    });
    if (!quote) return { failure: "Introuvable" } as const;
    return { success: true, result: quote } as const;
  });

const UpdateQuoteSchema = z.object({
  id: z.string(),
  // Champs éditables existants
  marginUSD: z.number().optional(),
  freightToMineUSD: z.number().optional(),
  description: z.string().optional().nullable(),
  proformaNumber: z.string().optional().nullable(),
  tvaApplicable: z.boolean().optional(),
  tvaAmount: z.number().optional().nullable(),
  clientId: z.string().optional().nullable(),
  // Nouveaux champs pour aligner l'édition avec la création
  costBuildUpId: z.string().optional().nullable(),
  baseDDUUSD: z.number().optional().nullable(),
  baseDDPUSD: z.number().optional().nullable(),
  totalDDUUSD: z.number().optional().nullable(),
  totalDDPUSD: z.number().optional().nullable(),
});

export const updateQuote = actionClient
  .schema(UpdateQuoteSchema)
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput as any;
    const updated = await prisma.salesQuote.update({
      where: { id },
      data: {
        marginUSD: data.marginUSD ?? undefined,
        freightToMineUSD: data.freightToMineUSD ?? undefined,
        description: data.description ?? undefined,
        proformaNumber: data.proformaNumber ?? undefined,
        tvaApplicable: data.tvaApplicable ?? undefined,
        tvaAmount: data.tvaAmount ?? undefined,
        clientId: data.clientId ?? undefined,
        // Mettre à jour les champs de base et totaux si fournis
        baseDDUUSD: data.baseDDUUSD ?? undefined,
        baseDDPUSD: data.baseDDPUSD ?? undefined,
        totalDDUUSD: data.totalDDUUSD ?? undefined,
        totalDDPUSD: data.totalDDPUSD ?? undefined,
        // Re-lier le Cost Build Up si demandé
        ...(data.costBuildUpId ? { costBuildUp: { connect: { id: data.costBuildUpId } } } : {}),
      } as any,
    });
    return { success: true, result: updated } as const;
  });

export const deleteQuote = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    await prisma.salesQuote.delete({ where: { id: parsedInput.id } });
    return { success: true } as const;
  });

export async function computeBasePrices(costBuildUpId: string) {
  const item = await prisma.costBuildUp.findUnique({
    where: { id: costBuildUpId },
    include: { totals: true, transport: true, supplierDDU: true },
  });
  if (!item) return { success: false as const, failure: "Introuvable" };

  const priceDDU = Number(item.totals?.priceDDUUSD || 0);
  const priceDDP = Number(item.totals?.priceDDPUSD || 0);

  // Retirer la marge fournisseur et freight to mine des bases
  const supplierMargin = Number(item.supplierDDU?.supplierMarginUSD || 0);
  const freightToMine = Number(item.transport?.freightToMineUSD || 0);

  const baseDDUUSD = Math.max(0, priceDDU - supplierMargin);
  const baseDDPUSD = Math.max(0, priceDDP - freightToMine);

  return { success: true as const, result: { baseDDUUSD, baseDDPUSD } };
}


