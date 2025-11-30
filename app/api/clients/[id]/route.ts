import prisma from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

const storePath = path.join(process.cwd(), "temp-storage.json");
async function readStore() { try { return JSON.parse(await fs.readFile(storePath, "utf8")); } catch { return {}; } }
async function writeStore(obj: any) { await fs.writeFile(storePath, JSON.stringify(obj, null, 2), "utf8"); }

export async function PUT(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await _.json();
    if ((prisma as any)?.client) {
      const updated = await (prisma as any).client.update({
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
    }
    const store = await readStore();
    const list = Array.isArray(store.clients) ? store.clients : [];
    const idx = list.findIndex((x: any) => x.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...body, updatedAt: new Date().toISOString() };
    }
    store.clients = list;
    await writeStore(store);
    return Response.json(list[idx] ?? null);
  } catch (e: any) {
    return Response.json({ error: e?.message || "server error" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    if ((prisma as any)?.client) {
      await (prisma as any).client.delete({ where: { id } });
      return new Response(null, { status: 204 });
    }
    const store = await readStore();
    store.clients = Array.isArray(store.clients) ? store.clients.filter((x: any) => x.id !== id) : [];
    await writeStore(store);
    return new Response(null, { status: 204 });
  } catch (e: any) {
    return Response.json({ error: e?.message || "server error" }, { status: 500 });
  }
}


