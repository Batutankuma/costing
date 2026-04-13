"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const optionalNullableString = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}, z.string().nullable().optional());

const ClientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nom requis"),
  company: optionalNullableString,
  email: z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }, z.string().email("Email invalide").nullable().optional()),
  phone: optionalNullableString,
  address: optionalNullableString,
  rccm: optionalNullableString,
  idNat: optionalNullableString,
  nif: optionalNullableString,
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  notes: optionalNullableString,
});

const CreateClientSchema = ClientSchema.omit({ id: true });

/**
 * @description Liste tous les clients.
 */
export async function getClients() {
  try {
    return await prisma.client.findMany({ 
      orderBy: { createdAt: 'desc' } 
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des clients:", error);
    return [];
  }
}

/**
 * @description Récupère un client par son ID.
 */
export async function getClientById(id: string) {
  try {
    if (!id) throw new Error("L'ID du client est manquant.");
    const result = await prisma.client.findUnique({ where: { id } });
    if (!result) return null;
    return result;
  } catch (error) {
    console.error("Erreur lors de la récupération du client:", error);
    return null;
  }
}

/**
 * @description Crée un nouveau client.
 */
export const createClient = actionClient
  .schema(CreateClientSchema)
  .action(async ({ parsedInput }) => {
    try {
      const created = await prisma.client.create({
        data: parsedInput,
      });
      revalidatePath("/dashboard/clients");
      return { success: created };
    } catch (error) {
      console.error("Erreur lors de la création du client:", error);
      return { failure: "Impossible de créer le client." };
    }
  });

/**
 * @description Met à jour un client existant.
 */
export const updateClient = actionClient
  .schema(ClientSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, ...data } = parsedInput;
      if (!id) return { failure: "ID manquant" };
      
      const result = await prisma.client.update({
        where: { id },
        data,
      });
      revalidatePath("/dashboard/clients");
      revalidatePath(`/dashboard/clients/${id}`);
      revalidatePath(`/dashboard/clients/views/${id}`);
      return { success: result };
    } catch (error) {
      console.error("Erreur lors de la mise à jour du client:", error);
      return { failure: "Impossible de mettre à jour le client." };
    }
  });

/**
 * @description Supprime un client par son ID.
 */
export const deleteClient = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const { id } = parsedInput;
      
      // Vérifier si le client existe
      const existing = await prisma.client.findUnique({ where: { id } });
      if (!existing) {
        return { failure: "Client introuvable." };
      }
      
      // Vérifier s'il existe des références (livraisons ou stocks)
      const [delivery, stock] = await Promise.all([
        prisma.delivery?.findFirst({ where: { clientId: id }, select: { id: true } }).catch(() => null),
        prisma.stock?.findFirst({ where: { clientId: id }, select: { id: true } }).catch(() => null),
      ]);
      
      if (delivery || stock) {
        return { failure: "Impossible de supprimer: le client est référencé dans des livraisons ou stocks." };
      }
      
      await prisma.client.delete({ where: { id } });
      revalidatePath("/dashboard/clients");
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression du client:", error);
      return { failure: "Impossible de supprimer le client." };
    }
  });


