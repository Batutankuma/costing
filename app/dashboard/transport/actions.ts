"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const TransporteurSchema = z.object({
  id: z.string().optional(),
  nom: z.string().min(1, "Nom requis"),
  description: z.string().optional().nullable(),
  adresse: z.string().optional().nullable(),
  contactTelephone: z.string().optional().nullable(),
  mail: z.string().email("Email invalide").optional().nullable().or(z.literal("")),
});

const CreateTransporteurSchema = TransporteurSchema.omit({ id: true });

export async function getTransporteurById(id: string) {
  try {
    if (!id) throw new Error("L'ID du transporteur est manquant.");
    return await prisma.transporteur.findUnique({ where: { id } });
  } catch (error) {
    console.error("Erreur lors de la récupération du transporteur:", error);
    return null;
  }
}

export const createTransporteur = actionClient
  .schema(CreateTransporteurSchema)
  .action(async ({ parsedInput }) => {
    try {
      const created = await prisma.transporteur.create({
        data: {
          nom: parsedInput.nom,
          description: parsedInput.description ?? null,
          adresse: parsedInput.adresse ?? null,
          contactTelephone: parsedInput.contactTelephone ?? null,
          mail: parsedInput.mail === "" ? null : parsedInput.mail ?? null,
        },
      });
      revalidatePath("/dashboard/transport");
      return { success: created };
    } catch (error) {
      console.error("Erreur lors de la création du transporteur:", error);
      return { failure: "Impossible de créer le transporteur." };
    }
  });

export const updateTransporteur = actionClient
  .schema(TransporteurSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, ...data } = parsedInput;
      if (!id) return { failure: "ID manquant" };

      const result = await prisma.transporteur.update({
        where: { id },
        data: {
          nom: data.nom,
          description: data.description ?? null,
          adresse: data.adresse ?? null,
          contactTelephone: data.contactTelephone ?? null,
          mail: data.mail === "" ? null : data.mail ?? null,
        },
      });
      revalidatePath("/dashboard/transport");
      revalidatePath(`/dashboard/transport/${id}`);
      return { success: result };
    } catch (error) {
      console.error("Erreur lors de la mise à jour du transporteur:", error);
      return { failure: "Impossible de mettre à jour le transporteur." };
    }
  });

export const deleteTransporteur = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      await prisma.transporteur.delete({ where: { id: parsedInput.id } });
      revalidatePath("/dashboard/transport");
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression du transporteur:", error);
      return { failure: "Impossible de supprimer le transporteur." };
    }
  });
