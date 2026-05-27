import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { handlePrismaError } from "@/middlewares/message_error";
import { CreateManualFactureSchema, ManualFactureSchema } from "@/models/mvc";
import {
  MANUAL_FACTURE_CONFIG,
  type ManualFactureKind,
  type ManualFactureModuleConfig,
} from "@/lib/manual-facture-config";
import { z } from "zod";

type ManualFactureWithLines = z.infer<typeof ManualFactureSchema>;

function computeTotals(input: z.infer<typeof CreateManualFactureSchema>) {
  const subtotal = input.lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const taxAmount = (subtotal * input.taxRate) / 100;
  const total = subtotal + taxAmount + input.otherFees;
  return { subtotal, taxAmount, total };
}

type PrismaFactureLine = {
  description: string;
  unit: string;
  quantity: number | string;
  unitPrice: number | string;
};

type PrismaFacture = {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  vendorName: string;
  vendorAddress: string | null;
  vendorTaxNumber: string | null;
  clientName: string;
  clientAddress: string | null;
  clientTaxNumber: string | null;
  purchaseOrder: string | null;
  dueInDays: number;
  currency: string;
  notes: string | null;
  taxRate: number;
  otherFees: number;
  subtotal: number;
  taxAmount: number;
  total: number;
  lines?: PrismaFactureLine[];
};

function mapFacture(facture: PrismaFacture): ManualFactureWithLines {
  return ManualFactureSchema.parse({
    ...facture,
    lines: (facture.lines ?? []).map((line: PrismaFactureLine) => ({
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

function parseNextIndex(invoiceNumber: string, config: ManualFactureModuleConfig): number {
  const suffix = invoiceNumber.split("-").pop() ?? "";
  if (!suffix.includes("/")) return 1;

  if (config.numberPrefix) {
    const match = invoiceNumber.match(/^PRO-(\d+)-/);
    if (match) {
      const parsed = parseInt(match[1], 10);
      return !isNaN(parsed) && parsed > 0 ? parsed + 1 : 1;
    }
    return 1;
  }

  const [prefix] = invoiceNumber.split("-");
  const parsed = parseInt(prefix, 10);
  return !isNaN(parsed) && parsed > 0 ? parsed + 1 : 1;
}

export function createManualFactureActions(kind: ManualFactureKind) {
  const config = MANUAL_FACTURE_CONFIG[kind];

  const createFactureAction = actionClient
    .schema(CreateManualFactureSchema)
    .action(async ({ parsedInput }) => {
      try {
        const accountId = await getDefaultAccountId();
        const { subtotal, taxAmount, total } = computeTotals(parsedInput);
        const created = await prisma.manualFacture.create({
          data: {
            kind,
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
        revalidatePath(config.basePath);
        return { success: mapFacture(created) };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return { failure: error.errors.map((err) => err.message).join(", ") };
        }
        return { failure: handlePrismaError(error) };
      }
    });

  const getNextInvoiceNumberAction = actionClient.schema(z.void()).action(async () => {
    try {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.toLocaleDateString("fr-FR", { year: "2-digit" });
      const suffix = `-${month}/${year}`;

      const lastFacture = await prisma.manualFacture.findFirst({
        where: {
          kind,
          invoiceNumber: config.numberPrefix
            ? { startsWith: config.numberPrefix, endsWith: suffix }
            : { endsWith: suffix },
        },
        select: { invoiceNumber: true },
        orderBy: { createdAt: "desc" },
      });

      const nextIndex = lastFacture?.invoiceNumber
        ? parseNextIndex(lastFacture.invoiceNumber, config)
        : 1;

      const invoiceNumber = `${config.numberPrefix}${nextIndex}${suffix}`;
      return { success: invoiceNumber };
    } catch (error) {
      return { failure: handlePrismaError(error) };
    }
  });

  const listCommandeReferencesAction = actionClient.schema(z.void()).action(async () => {
    try {
      const commandes = await prisma.commande.findMany({
        select: { reference: true, date: true },
        orderBy: { date: "desc" },
        take: 300,
      });
      return { success: commandes };
    } catch (error) {
      return { failure: handlePrismaError(error) };
    }
  });

  const getAutoFactureFromCommandeAction = actionClient
    .schema(z.object({ reference: z.string().min(1, "Référence commande requise") }))
    .action(async ({ parsedInput }) => {
      try {
        const [deliveries, clientOrder] = await Promise.all([
          prisma.delivery.findMany({
            where: { commandNumber: parsedInput.reference },
            orderBy: { deliveryDate: "asc" },
            include: {
              client: {
                select: { id: true, name: true, company: true, address: true, nif: true },
              },
              produit: { select: { name: true, unit: true } },
            },
          }),
          prisma.clientOrder.findUnique({
            where: { reference: parsedInput.reference },
            select: { unitPrice: true, devise: true },
          }),
        ]);

        if (deliveries.length === 0) {
          return {
            failure: `Aucune livraison liée au bon de commande ${parsedInput.reference}.`,
          };
        }

        const lines = deliveries.map((delivery) => ({
          description:
            delivery.produit?.name ||
            delivery.remarks ||
            `Livraison ${delivery.reference || delivery.id}`,
          unit: delivery.unit || delivery.produit?.unit || "L",
          quantity: Number(delivery.qOffloaded ?? delivery.quantity ?? 0),
          unitPrice: Number(delivery.prixUnitaire ?? clientOrder?.unitPrice ?? 0),
          dn: delivery.reference || delivery.id,
        }));

        const firstClient = deliveries.find((d) => d.client)?.client ?? null;

        return {
          success: {
            purchaseOrder: parsedInput.reference,
            lines,
            client: firstClient
              ? {
                  id: firstClient.id,
                  name: firstClient.company || firstClient.name || "",
                  address: firstClient.address || "",
                  taxNumber: firstClient.nif || "",
                }
              : null,
          },
        };
      } catch (error) {
        return { failure: handlePrismaError(error) };
      }
    });

  async function findFactureById(id: string) {
    try {
      if (!id) throw new Error("Identifiant facture manquant");
      const facture = await prisma.manualFacture.findFirst({
        where: { id, kind },
        include: { lines: true },
      });
      if (!facture) return { success: false, failure: "Facture introuvable." };
      return { success: true, result: mapFacture(facture) };
    } catch (error) {
      return { success: false, failure: handlePrismaError(error) };
    }
  }

  const findAllFacturesAction = actionClient.schema(z.void()).action(async () => {
    try {
      const factures = await prisma.manualFacture.findMany({
        where: { kind },
        orderBy: { invoiceDate: "desc" },
        include: { lines: true },
      });
      return { success: true, result: factures.map(mapFacture) };
    } catch (error) {
      return { success: false, failure: handlePrismaError(error) };
    }
  });

  const updateFactureAction = actionClient.schema(ManualFactureSchema).action(async ({ parsedInput }) => {
    try {
      const existing = await prisma.manualFacture.findFirst({
        where: { id: parsedInput.id, kind },
        select: { id: true },
      });
      if (!existing) return { failure: "Facture introuvable." };

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
      revalidatePath(config.basePath);
      revalidatePath(`${config.basePath}/${parsedInput.id}`);
      revalidatePath(`${config.basePath}/views/${parsedInput.id}`);
      return { success: mapFacture(result) };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { failure: error.errors.map((err) => err.message).join(", ") };
      }
      return { failure: handlePrismaError(error) };
    }
  });

  const removeFactureAction = actionClient.schema(z.object({ id: z.string() })).action(async ({ parsedInput }) => {
    try {
      const existing = await prisma.manualFacture.findFirst({
        where: { id: parsedInput.id, kind },
        select: { id: true },
      });
      if (!existing) return { failure: "Facture introuvable." };
      await prisma.manualFacture.delete({ where: { id: parsedInput.id } });
      revalidatePath(config.basePath);
      return { success: true };
    } catch (error) {
      return { failure: handlePrismaError(error) };
    }
  });

  return {
    config,
    createFactureAction,
    getNextInvoiceNumberAction,
    listCommandeReferencesAction,
    getAutoFactureFromCommandeAction,
    findFactureById,
    findAllFacturesAction,
    updateFactureAction,
    removeFactureAction,
  };
}
