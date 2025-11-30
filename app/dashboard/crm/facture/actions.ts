"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { handlePrismaError } from "@/middlewares/message_error";
import { CreateManualFactureSchema, ManualFactureSchema } from "@/models/mvc";
import { z } from "zod";

const ManualFactureLineSchema = z.object({
  description: z.string(),
  unit: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
});

type ManualFactureLineInput = z.infer<typeof ManualFactureLineSchema>;

type ManualFactureWithLines = z.infer<typeof ManualFactureSchema>;

function computeTotals(input: z.infer<typeof CreateManualFactureSchema>) {
  const subtotal = input.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const taxAmount = (subtotal * input.taxRate) / 100;
  const total = subtotal + taxAmount + input.otherFees;
  return { subtotal, taxAmount, total };
}

function mapFacture(facture: any): ManualFactureWithLines {
  return ManualFactureSchema.parse({
    ...facture,
    lines: (facture.lines ?? []).map((line: any) => ({
      description: line.description,
      unit: line.unit,
      quantity: Number(line.quantity),
      unitPrice: Number(line.unitPrice),
    })),
  });
}

async function getDefaultAccountId(): Promise<string | null> {
  const account = await prisma.account.findFirst({ select: { id: true } });
  return account?.id ?? null;
}

export const createFactureAction = actionClient
  .schema(CreateManualFactureSchema)
  .action(async ({ parsedInput }) => {
    try {
      const accountId = await getDefaultAccountId();
      const { subtotal, taxAmount, total } = computeTotals(parsedInput);
      const created = await prisma.manualFacture.create({
        data: {
          invoiceNumber: parsedInput.invoiceNumber,
          invoiceDate: parsedInput.invoiceDate,
          vendorName: parsedInput.vendorName,
          vendorAddress: parsedInput.vendorAddress ?? null,
          vendorTaxNumber: parsedInput.vendorTaxNumber ?? null,
          clientName: parsedInput.clientName,
          clientAddress: parsedInput.clientAddress ?? null,
          clientTaxNumber: parsedInput.clientTaxNumber ?? null,
          purchaseOrder: parsedInput.purchaseOrder ?? null,
          dueInDays: parsedInput.dueInDays,
          currency: parsedInput.currency,
          notes: parsedInput.notes ?? null,
          taxRate: parsedInput.taxRate,
          otherFees: parsedInput.otherFees,
          subtotal,
          taxAmount,
          total,
          accountId,
          lines: {
            create: parsedInput.lines.map((line) => ({
              description: line.description,
              unit: line.unit,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
            })),
          },
        },
        include: { lines: true },
      });
      revalidatePath("/dashboard/crm/facture");
      return { success: mapFacture(created) };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { failure: error.errors.map((err) => err.message).join(", ") };
      }
      return { failure: handlePrismaError(error) };
    }
  });

export async function findFactureById(id: string) {
  try {
    if (!id) throw new Error("Identifiant facture manquant");
    const facture = await prisma.manualFacture.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!facture) return { success: false, failure: "Facture introuvable." };
    return { success: true, result: mapFacture(facture) };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

export const findAllFacturesAction = actionClient
  .schema(z.void())
  .action(async () => {
    try {
      const factures = await prisma.manualFacture.findMany({
        orderBy: { invoiceDate: "desc" },
        include: { lines: true },
      });
      return { success: true, result: factures.map(mapFacture) };
    } catch (error) {
      return { success: false, failure: handlePrismaError(error) };
    }
  });

export const updateFactureAction = actionClient
  .schema(ManualFactureSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { subtotal, taxAmount, total } = computeTotals(parsedInput);
      const result = await prisma.$transaction(async (tx) => {
        await tx.manualFactureLine.deleteMany({ where: { factureId: parsedInput.id } });
        const updated = await tx.manualFacture.update({
          where: { id: parsedInput.id },
          data: {
            invoiceNumber: parsedInput.invoiceNumber,
            invoiceDate: parsedInput.invoiceDate,
            vendorName: parsedInput.vendorName,
            vendorAddress: parsedInput.vendorAddress ?? null,
            vendorTaxNumber: parsedInput.vendorTaxNumber ?? null,
            clientName: parsedInput.clientName,
            clientAddress: parsedInput.clientAddress ?? null,
            clientTaxNumber: parsedInput.clientTaxNumber ?? null,
            purchaseOrder: parsedInput.purchaseOrder ?? null,
            dueInDays: parsedInput.dueInDays,
            currency: parsedInput.currency,
            notes: parsedInput.notes ?? null,
            taxRate: parsedInput.taxRate,
            otherFees: parsedInput.otherFees,
            subtotal,
            taxAmount,
            total,
            lines: {
              create: parsedInput.lines.map((line) => ({
                description: line.description,
                unit: line.unit,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
              })),
            },
          },
          include: { lines: true },
        });
        return updated;
      });
      revalidatePath("/dashboard/crm/facture");
      revalidatePath(`/dashboard/crm/facture/${parsedInput.id}`);
      revalidatePath(`/dashboard/crm/facture/views/${parsedInput.id}`);
      return { success: mapFacture(result) };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { failure: error.errors.map((err) => err.message).join(", ") };
      }
      return { failure: handlePrismaError(error) };
    }
  });

export const removeFactureAction = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      await prisma.manualFacture.delete({ where: { id: parsedInput.id } });
      revalidatePath("/dashboard/crm/facture");
      return { success: true };
    } catch (error) {
      return { failure: handlePrismaError(error) };
    }
  });
