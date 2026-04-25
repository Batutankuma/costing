"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { handlePrismaError } from "@/middlewares/message_error";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateClientOrderSchema = z.object({
  reference: z.string().min(1, "La reference est requise"),
  date: z.date(),
  status: z.enum(["DRAFT", "CONFIRMED", "PARTIALLY_RECEIVED", "COMPLETED", "CANCELLED"]).default("DRAFT"),
  clientId: z.string().min(1, "Le client est requis"),
  produitId: z.string().min(1, "Le produit est requis"),
  quantity: z.number().min(0.01, "La quantite doit etre superieure a 0"),
  unitPrice: z.number().min(0, "Le prix unitaire est invalide"),
  devise: z.enum(["USD", "CDF", "EUR", "XOF"]).default("USD"),
  notes: z.string().optional().nullable(),
});

const UpdateClientOrderSchema = CreateClientOrderSchema.extend({
  id: z.string().min(1, "ID requis"),
});

export const createClientOrderAction = actionClient
  .schema(CreateClientOrderSchema)
  .action(async ({ parsedInput }) => {
    try {
      const created = await prisma.clientOrder.create({
        data: {
          reference: parsedInput.reference,
          date: parsedInput.date,
          status: parsedInput.status,
          clientId: parsedInput.clientId,
          produitId: parsedInput.produitId,
          quantity: parsedInput.quantity,
          unitPrice: parsedInput.unitPrice,
          devise: parsedInput.devise,
          notes: parsedInput.notes || null,
        },
      });
      revalidatePath("/dashboard/client-orders");
      return { success: created };
    } catch (error) {
      return { failure: handlePrismaError(error) };
    }
  });

export const listClientOrdersAction = actionClient
  .schema(z.void())
  .action(async () => {
    try {
      const result = await prisma.clientOrder.findMany({
        include: {
          client: { select: { id: true, name: true, company: true } },
          produit: { select: { id: true, name: true, unit: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return { success: result };
    } catch (error) {
      return { failure: handlePrismaError(error) };
    }
  });

export const deleteClientOrderAction = actionClient
  .schema(z.object({ id: z.string().min(1) }))
  .action(async ({ parsedInput }) => {
    try {
      await prisma.clientOrder.delete({ where: { id: parsedInput.id } });
      revalidatePath("/dashboard/client-orders");
      return { success: true };
    } catch (error) {
      return { failure: handlePrismaError(error) };
    }
  });

export async function getClientOrderById(id: string) {
  try {
    if (!id) return null;
    return await prisma.clientOrder.findUnique({
      where: { id },
      include: {
        client: { select: { id: true, name: true, company: true } },
        produit: { select: { id: true, name: true, unit: true } },
      },
    });
  } catch {
    return null;
  }
}

export const updateClientOrderAction = actionClient
  .schema(UpdateClientOrderSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, ...data } = parsedInput;
      const updated = await prisma.clientOrder.update({
        where: { id },
        data: {
          reference: data.reference,
          date: data.date,
          status: data.status,
          clientId: data.clientId,
          produitId: data.produitId,
          quantity: data.quantity,
          unitPrice: data.unitPrice,
          devise: data.devise,
          notes: data.notes || null,
        },
      });
      revalidatePath("/dashboard/client-orders");
      revalidatePath(`/dashboard/client-orders/${id}`);
      revalidatePath(`/dashboard/client-orders/views/${id}`);
      return { success: updated };
    } catch (error) {
      return { failure: handlePrismaError(error) };
    }
  });
