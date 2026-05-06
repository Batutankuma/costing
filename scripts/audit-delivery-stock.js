const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const pg = require("pg");
const fs = require("fs");
const path = require("path");

function loadEnvFromDotEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx <= 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const rawValue = trimmed.slice(eqIdx + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    loadEnvFromDotEnv();
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not defined");
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  try {
    const deliveries = await prisma.delivery.findMany({
      select: {
        id: true,
        reference: true,
        commandNumber: true,
        deliveryDate: true,
        depotId: true,
        produitId: true,
        qOffloaded: true,
        quantity: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const stocks = await prisma.stock.findMany({
      where: { type: "SORTIE" },
      select: {
        id: true,
        deliveryId: true,
        reference: true,
        depotId: true,
        produitId: true,
      },
    });

    const byDeliveryId = new Map(
      stocks.filter((row) => row.deliveryId).map((row) => [row.deliveryId, row]),
    );

    const missing = [];
    for (const delivery of deliveries) {
      if (byDeliveryId.has(delivery.id)) continue;
      const fallbackReference = delivery.reference || `Livraison ${delivery.id}`;
      const fallback = stocks.find(
        (row) =>
          row.reference === fallbackReference &&
          row.depotId === delivery.depotId &&
          row.produitId === delivery.produitId,
      );
      if (!fallback) {
        missing.push({
          id: delivery.id,
          reference: delivery.reference,
          commandNumber: delivery.commandNumber,
          deliveryDate: delivery.deliveryDate,
          qty: delivery.qOffloaded ?? delivery.quantity ?? 0,
        });
      }
    }

    console.log(
      JSON.stringify(
        {
          totalDeliveries: deliveries.length,
          totalSortieStocks: stocks.length,
          missingCount: missing.length,
          sampleMissing: missing.slice(0, 30),
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
