import prisma from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

const storePath = path.join(process.cwd(), "temp-storage.json");
async function readStore() { try { return JSON.parse(await fs.readFile(storePath, "utf8")); } catch { return {}; } }
async function writeStore(obj: any) { await fs.writeFile(storePath, JSON.stringify(obj, null, 2), "utf8"); }

export async function GET() {
  if ((prisma as any)?.prospect) {
    const list = await (prisma as any).prospect.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json(list);
  }
  const store = await readStore();
  const list = Array.isArray(store.prospects) ? store.prospects : [];
  return Response.json(list);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.name || String(body.name).trim().length === 0) {
      return Response.json({ error: "Nom requis" }, { status: 400 });
    }
    if ((prisma as any)?.prospect) {
      const created = await (prisma as any).prospect.create({
        data: {
          name: body.name,
          company: body.company ?? null,
          email: body.email ?? null,
          phone: body.phone ?? null,
          source: body.source ?? null,
          stage: body.stage ?? "NEW",
          ownerId: body.ownerId ?? null,
          notes: body.notes ?? null,
        },
      });
      return Response.json(created, { status: 201 });
    }
    const store = await readStore();
    const created = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...body };
    store.prospects = Array.isArray(store.prospects) ? [...store.prospects, created] : [created];
    await writeStore(store);
    return Response.json(created, { status: 201 });
  } catch (e: any) {
    return Response.json({ error: e?.message || "server error" }, { status: 500 });
  }
}


