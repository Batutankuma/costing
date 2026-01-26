"use server";

import { z } from "zod";
import { actionClient } from "@/lib/safe-action";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { DGIFactureSchema } from "./schema";

export const createDGIFactureAction = actionClient
    .schema(DGIFactureSchema)
    .action(async ({ parsedInput: data }) => {

        // 1. Calcul des totaux
        let totalHT = 0;
        let totalTVA = 0;

        const linesToCreate = data.lines.map((line) => {
            const lineHT = line.quantity * line.unitPrice;
            const lineTVA = lineHT * (line.tvaRate / 100);

            totalHT += lineHT;
            totalTVA += lineTVA;

            return {
                description: line.description,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                unit: line.unit,
                tvaRate: line.tvaRate,
                totalHT: lineHT,
            };
        });

        const totalTTC = totalHT + totalTVA;

        // 2. & 3. Transaction pour garantir l'atomicité de la génération du numéro et de la création
        const newFacture = await prisma.$transaction(async (tx: any) => {
            // 2. Génération du numéro de facture
            const lastFacture = await tx.dGIFacture.findFirst({
                orderBy: { createdAt: "desc" },
                select: { invoiceNumber: true },
            });

            // Format simple: DGI-YYYY-0001
            const currentYear = new Date().getFullYear();
            let sequence = 1;

            if (lastFacture?.invoiceNumber) {
                const parts = lastFacture.invoiceNumber.split("-");
                if (parts.length === 3 && parts[1] === String(currentYear)) {
                    sequence = parseInt(parts[2]) + 1;
                }
            }
            const invoiceNumber = `DGI-${currentYear}-${String(sequence).padStart(4, "0")}`;

            // 3. Création
            const createdFacture = await tx.dGIFacture.create({
                data: {
                    invoiceNumber,
                    invoiceDate: data.invoiceDate,
                    clientName: data.clientName,
                    clientNif: data.clientNif,
                    clientAddress: data.clientAddress,
                    clientRccm: data.clientRccm,
                    clientId: data.clientId || null,
                    currency: data.currency,
                    notes: data.notes,

                    totalHT,
                    totalTVA,
                    totalTTC,

                    lines: {
                        create: linesToCreate
                    }
                },
            });
            return createdFacture;
        });

        revalidatePath("/dashboard/crm/facture-dgi");
        return { success: true, id: newFacture.id };
    });

export const findAllDGIFacturesAction = actionClient
    .action(async () => {
        const factures = await prisma.dGIFacture.findMany({
            orderBy: { createdAt: "desc" },
        });
        return { result: factures };
    });

export const getDGIFactureById = async (id: string) => {
    return await prisma.dGIFacture.findUnique({
        where: { id },
        include: { lines: true }
    });
}

// Alias pour compatibilité avec d'autres parties de l'application
export const findFactureDgiById = getDGIFactureById;

export const updateFactureDgiAction = actionClient
    .schema(z.object({
        id: z.string(),
        invoiceNumber: z.string(),
        invoiceDate: z.date(),
        clientName: z.string(),
        clientNif: z.string().optional(),
        clientAddress: z.string().optional(),
        clientRccm: z.string().optional(),
        clientId: z.string().optional(),
        currency: z.string(),
        notes: z.string().optional(),
        lines: z.array(z.object({
            description: z.string(),
            quantity: z.number(),
            unitPrice: z.number(),
            unit: z.string().optional(),
            tvaRate: z.number(),
        })),
    }))
    .action(async ({ parsedInput: data }) => {
        // 1. Calcul des totaux
        let totalHT = 0;
        let totalTVA = 0;

        const linesToCreate = data.lines.map((line) => {
            const lineHT = line.quantity * line.unitPrice;
            const lineTVA = lineHT * (line.tvaRate / 100);

            totalHT += lineHT;
            totalTVA += lineTVA;

            return {
                description: line.description,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                unit: line.unit,
                tvaRate: line.tvaRate,
                totalHT: lineHT,
            };
        });

        const totalTTC = totalHT + totalTVA;

        // 2. Transaction pour mettre à jour la facture et ses lignes
        const updatedFacture = await prisma.$transaction(async (tx: any) => {
            // Supprimer les anciennes lignes
            await tx.dGIFactureLine.deleteMany({
                where: { dgiFactureId: data.id },
            });

            // Mettre à jour la facture avec les nouvelles lignes
            const updated = await tx.dGIFacture.update({
                where: { id: data.id },
                data: {
                    invoiceNumber: data.invoiceNumber,
                    invoiceDate: data.invoiceDate,
                    clientName: data.clientName,
                    clientNif: data.clientNif,
                    clientAddress: data.clientAddress,
                    clientRccm: data.clientRccm,
                    clientId: data.clientId || null,
                    currency: data.currency,
                    notes: data.notes,

                    totalHT,
                    totalTVA,
                    totalTTC,

                    lines: {
                        create: linesToCreate
                    }
                },
            });
            return updated;
        });

        revalidatePath("/dashboard/crm/facture-dgi");
        return { success: true, id: updatedFacture.id };
    });

export const deleteDGIFactureAction = actionClient
    .schema(z.object({ id: z.string() }))
    .action(async ({ parsedInput: { id } }) => {
        await prisma.dGIFacture.delete({ where: { id } });
        revalidatePath("/dashboard/crm/facture-dgi");
        return { success: true };
    });
