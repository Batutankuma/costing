import prisma from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

const storePath = path.join(process.cwd(), "temp-storage.json");
async function readStore() { try { return JSON.parse(await fs.readFile(storePath, "utf8")); } catch { return {}; } }
async function writeStore(obj: Record<string, unknown>) { await fs.writeFile(storePath, JSON.stringify(obj, null, 2), "utf8"); }

export async function GET() {
  try {
    const list = await prisma.prospect.findMany({ orderBy: { createdAt: "desc" } });
    return Response.json(list);
  } catch {
    const store = await readStore();
    const list = Array.isArray(store.prospects) ? store.prospects : [];
    return Response.json(list);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.name || String(body.name).trim().length === 0) {
      return Response.json({ error: "Nom requis" }, { status: 400 });
    }
    try {
      const created = await prisma.prospect.create({
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
    } catch {
      const store = await readStore();
      const created = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...body };
      store.prospects = Array.isArray(store.prospects) ? [...store.prospects, created] : [created];
      await writeStore(store);
      return Response.json(created, { status: 201 });
    }
  } catch (e) {
    const error = e instanceof Error ? e.message : "server error";
    return Response.json({ error }, { status: 500 });
  }
}


