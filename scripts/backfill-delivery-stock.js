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

function getPrisma() {
  if (!process.env.DATABASE_URL) loadEnvFromDotEnv();
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not defined");
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

async function main() {
  const apply = process.argv.includes("--apply");
  const prisma = getPrisma();
  try {
    const deliveries = await prisma.delivery.findMany({
      select: {
        id: true,
        reference: true,
        deliveryDate: true,
        depotId: true,
        produitId: true,
        clientId: true,
        unit: true,
        quantity: true,
        qOffloaded: true,
        prixUnitaire: true,
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
    const deliveriesWithKeys = deliveries.filter((d) => d.depotId && d.produitId);
    const byDeliveryId = new Map(stocks.filter((s) => s.deliveryId).map((s) => [s.deliveryId, s]));
    const account = await prisma.account.findFirst({ select: { id: true } });

    const missing = deliveries.filter((d) => {
      if (byDeliveryId.has(d.id)) return false;
      const fallbackRef = d.reference || `Livraison ${d.id}`;
      const fallback = stocks.find(
        (s) =>
          s.reference === fallbackRef &&
          s.depotId === d.depotId &&
          s.produitId === d.produitId,
      );
      return !fallback;
    });

    if (!apply) {
      console.log(
        JSON.stringify(
          {
            mode: "dry-run",
            totalDeliveries: deliveries.length,
            missingCount: missing.length,
            sample: missing.slice(0, 20).map((d) => ({
              id: d.id,
              reference: d.reference,
              qty: d.qOffloaded ?? d.quantity ?? 0,
              depotId: d.depotId,
              produitId: d.produitId,
            })),
          },
          null,
          2,
        ),
      );
      return;
    }

    let created = 0;
    const errors = [];
    for (const d of missing) {
      try {
        let depotId = d.depotId || null;
        let produitId = d.produitId || null;
        if (!depotId || !produitId) {
          const keyRef = d.reference || d.commandNumber || null;
          const stockHint = keyRef
            ? stocks.find((s) => s.reference === keyRef && s.depotId && s.produitId)
            : null;
          const deliveryHint = deliveriesWithKeys.find(
            (x) =>
              x.id !== d.id &&
              ((d.reference && x.reference === d.reference) ||
                (d.commandNumber && x.commandNumber === d.commandNumber)),
          );
          depotId = depotId || stockHint?.depotId || deliveryHint?.depotId || null;
          produitId = produitId || stockHint?.produitId || deliveryHint?.produitId || null;
        }
        if (!depotId || !produitId) {
          errors.push({ id: d.id, reason: "depotId/produitId manquant (aucun indice)" });
          continue;
        }
        const quantite = Number(d.qOffloaded ?? d.quantity ?? 0);
        await prisma.stock.create({
          data: {
            deliveryId: d.id,
            date: d.deliveryDate,
            reference: d.reference || `Livraison ${d.id}`,
            depotId,
            type: "SORTIE",
            fournisseurId: null,
            clientId: d.clientId ?? null,
            produitId,
            quantite,
            prixUnitaireVente: d.prixUnitaire ?? null,
            prixUnitaireAchat: null,
            unite: d.unit,
            devise: "USD",
            seuilMinimum: 0,
            accountId: account?.id ?? undefined,
            valeurEntree: null,
            valeurSortie: null,
            stockQuantiteFinal: null,
            stockPrixUnitaireFinal: null,
            stockValeurFinal: null,
          },
        });
        created += 1;
      } catch (error) {
        errors.push({ id: d.id, reason: error instanceof Error ? error.message : "unknown" });
      }
    }

    console.log(
      JSON.stringify(
        {
          mode: "apply",
          missingCount: missing.length,
          created,
          errorCount: errors.length,
          errors: errors.slice(0, 20),
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
