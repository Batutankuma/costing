import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create a single PrismaClient instance and cache it in global in dev
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const pool = new pg.Pool({
  connectionString,
  max: Number(process.env.PGPOOL_MAX ?? 10),
  connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS ?? 15_000),
  // Retirer les clients inactifs avant que le serveur ne ferme la socket (évite P1017 sur requêtes espacées)
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS ?? 30_000),
  keepAlive: true,
});

pool.on("error", (err) => {
  console.error("[prisma/pg] Pool error (connexion base)", err);
});

const adapter = new PrismaPg(pool);

const prismaInstance: PrismaClient =
  global.prisma ??
  new PrismaClient({
    adapter,
    log: ["query", "error", "warn"],
  });
if (process.env.NODE_ENV !== "production") {
  global.prisma = prismaInstance;
}

export default prismaInstance;


