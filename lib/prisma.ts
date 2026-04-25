import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

type GlobalPrismaCache = typeof globalThis & {
  prisma?: PrismaClient;
  pgPool?: pg.Pool;
};

const globalForPrisma = globalThis as GlobalPrismaCache;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const pool =
  globalForPrisma.pgPool ??
  new pg.Pool({
    connectionString,
    max: Number(process.env.PGPOOL_MAX ?? 10),
    connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS ?? 15_000),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS ?? 30_000),
    maxLifetimeSeconds: Number(process.env.PG_MAX_LIFETIME_S ?? 300),
    keepAlive: true,
    keepAliveInitialDelayMillis: Number(process.env.PG_KEEPALIVE_DELAY_MS ?? 10_000),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pgPool = pool;
}

pool.on("error", (err) => {
  console.error("[prisma/pg] Pool connection error", err);
});

const adapter = new PrismaPg(pool);

const prismaInstance: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "production" ? ["error"] : ["error", "warn"],
    transactionOptions: {
      maxWait: 10000,
      timeout: 10000,
    },
  });
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prismaInstance;
}

export default prismaInstance;


