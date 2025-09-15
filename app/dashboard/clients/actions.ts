"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { z } from "zod";
import { promises as fs } from "fs";
import path from "path";

const storePath = path.join(process.cwd(), "temp-storage.json");
async function readStore() { try { return JSON.parse(await fs.readFile(storePath, "utf8")); } catch { return {}; } }
async function writeStore(obj: any) { await fs.writeFile(storePath, JSON.stringify(obj, null, 2), "utf8"); }

const ClientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Nom requis"),
  company: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  notes: z.string().optional().nullable(),
});

export async function getClients() {
  if ((prisma as any)?.client) {
    return await (prisma as any).client.findMany({ orderBy: { createdAt: "desc" } });
  }
  const store = await readStore();
  return Array.isArray(store.clients) ? store.clients : [];
}

export const createClient = actionClient
  .schema(ClientSchema.omit({ id: true }))
  .action(async ({ parsedInput }) => {
    if ((prisma as any)?.client) {
      const created = await (prisma as any).client.create({ data: parsedInput });
      return { success: created };
    }
    const store = await readStore();
    const created = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...parsedInput };
    store.clients = Array.isArray(store.clients) ? [...store.clients, created] : [created];
    await writeStore(store);
    return { success: created };
  });

export const updateClient = actionClient
  .schema(ClientSchema)
  .action(async ({ parsedInput }) => {
    const { id, ...data } = parsedInput;
    if (!id) return { failure: "ID manquant" };
    if ((prisma as any)?.client) {
      const updated = await (prisma as any).client.update({ where: { id }, data });
      return { success: updated };
    }
    const store = await readStore();
    const list = Array.isArray(store.clients) ? store.clients : [];
    const idx = list.findIndex((x: any) => x.id === id);
    if (idx >= 0) list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
    store.clients = list;
    await writeStore(store);
    return { success: list[idx] };
  });

export const deleteClient = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    const { id } = parsedInput;
    if ((prisma as any)?.client) {
      await (prisma as any).client.delete({ where: { id } });
      return { success: true };
    }
    const store = await readStore();
    store.clients = Array.isArray(store.clients) ? store.clients.filter((x: any) => x.id !== id) : [];
    await writeStore(store);
    return { success: true };
  });


