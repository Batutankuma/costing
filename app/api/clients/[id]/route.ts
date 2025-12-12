import prisma from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

const storePath = path.join(process.cwd(), "temp-storage.json");
async function readStore() { try { return JSON.parse(await fs.readFile(storePath, "utf8")); } catch { return {}; } }
async function writeStore(obj: Record<string, unknown>) { await fs.writeFile(storePath, JSON.stringify(obj, null, 2), "utf8"); }

export async function PUT(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await _.json();
    try {
      const updated = await prisma.client.update({
        where: { id },
        data: {
          name: body.name,
          company: body.company ?? null,
          email: body.email ?? null,
          phone: body.phone ?? null,
          address: body.address ?? null,
          status: body.status ?? undefined,
          notes: body.notes ?? null,
        },
      });
      return Response.json(updated);
    } catch {
      const store = await readStore();
      const list = Array.isArray(store.clients) ? store.clients : [];
      const idx = list.findIndex((x: { id: string }) => x.id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...body, updatedAt: new Date().toISOString() };
      }
      store.clients = list;
      await writeStore(store);
      return Response.json(list[idx] ?? null);
    }
  } catch (e) {
    const error = e instanceof Error ? e.message : "server error";
    return Response.json({ error }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    try {
      await prisma.client.delete({ where: { id } });
      return new Response(null, { status: 204 });
    } catch {
      const store = await readStore();
      store.clients = Array.isArray(store.clients) ? store.clients.filter((x: { id: string }) => x.id !== id) : [];
      await writeStore(store);
      return new Response(null, { status: 204 });
    }
  } catch (e) {
    const error = e instanceof Error ? e.message : "server error";
    return Response.json({ error }, { status: 500 });
  }
}


