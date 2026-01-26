import { z } from "zod";

export const DGIFactureSchema = z.object({
    clientName: z.string().min(1, "Le nom du client est requis"),
    clientNif: z.string().optional(),
    clientAddress: z.string().optional(),
    clientRccm: z.string().optional(),
    clientId: z.string().optional(),

    invoiceDate: z.date(),
    currency: z.enum(["USD", "CDF"]),
    notes: z.string().optional(),

    lines: z.array(
        z.object({
            description: z.string().min(1, "Description requise"),
            quantity: z.number().min(0.001, "Quantité > 0"),
            unitPrice: z.number().min(0, "Prix >= 0"),
            unit: z.string().optional(),
            tvaRate: z.number(),
        })
    ).min(1, "Ajoutez au moins une ligne"),
});

