import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create a single PrismaClient instance and cache it in global in dev
const prismaInstance: PrismaClient = global.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  global.prisma = prismaInstance;
}

export default prismaInstance;


