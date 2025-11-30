import prisma from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

const storePath = path.join(process.cwd(), "temp-storage.json");
const defaults = [
  { destination: "Likasi (before peage)", rateUsdPerCbm: 50 },
  { destination: "Likasi (after peage)", rateUsdPerCbm: 55 },
  { destination: "Kambove", rateUsdPerCbm: 65 },
  { destination: "kolwezi", rateUsdPerCbm: 75 },
  { destination: "Mokambo", rateUsdPerCbm: 65 },
  { destination: "Komoah", rateUsdPerCbm: 95 },
  { destination: "Fungurme", rateUsdPerCbm: 60 },
  { destination: "Luwisha", rateUsdPerCbm: 35 },
  { destination: "Lopoto", rateUsdPerCbm: 35 },
  { destination: "Kisanda", rateUsdPerCbm: 45 },
  { destination: "Kisamfu", rateUsdPerCbm: 65 },
  { destination: "kipoi", rateUsdPerCbm: 40 },
  { destination: "Kawama", rateUsdPerCbm: 15 },
  { destination: "Lubumbashi", rateUsdPerCbm: 15 },
  { destination: "Kibolve", rateUsdPerCbm: 65 },
];

async function readStore() {
  try {
    const raw = await fs.readFile(storePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeStore(obj: any) {
  await fs.writeFile(storePath, JSON.stringify(obj, null, 2), "utf8");
}

export async function GET() {
  // If Prisma client has the delegate, use DB
  if ((prisma as any)?.transportRate) {
    const list = await (prisma as any).transportRate.findMany({ orderBy: { destination: "asc" } });
    return Response.json(list);
  }

  // Fallback to file store
  const store = await readStore();
  if (!Array.isArray(store.transportRates) || store.transportRates.length === 0) {
    store.transportRates = defaults.map((d) => ({ id: crypto.randomUUID(), ...d }));
    await writeStore(store);
  }
  const list = [...store.transportRates].sort((a: any, b: any) => a.destination.localeCompare(b.destination));
  return Response.json(list);
}

export async function POST(request: Request) {
  const body = await request.json();
  if ((prisma as any)?.transportRate) {
    const created = await (prisma as any).transportRate.create({ data: { destination: body.destination, rateUsdPerCbm: Number(body.rateUsdPerCbm) } });
    return Response.json(created, { status: 201 });
  }

  const store = await readStore();
  const created = { id: crypto.randomUUID(), destination: body.destination, rateUsdPerCbm: Number(body.rateUsdPerCbm) };
  store.transportRates = Array.isArray(store.transportRates) ? [...store.transportRates, created] : [created];
  await writeStore(store);
  return Response.json(created, { status: 201 });
}


