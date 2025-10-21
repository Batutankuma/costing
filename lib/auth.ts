import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";

// Ensure a stable hex secret (64 chars). Prefer env; otherwise cache a dev-only secret in globalThis
function getAuthSecret(): string {
    const fromEnv = process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (fromEnv && /^[0-9a-fA-F]{64}$/.test(fromEnv)) return fromEnv;
    const g = globalThis as any;
    if (g.__BETTER_AUTH_DEV_SECRET && typeof g.__BETTER_AUTH_DEV_SECRET === "string") {
        return g.__BETTER_AUTH_DEV_SECRET as string;
    }
    try {
        const { randomBytes } = require("node:crypto");
        const secret = randomBytes(32).toString("hex");
        g.__BETTER_AUTH_DEV_SECRET = secret;
        return secret;
    } catch {
        const fallback = "a1b2c3d4e5f60718293a4b5c6d7e8f90112233445566778899aabbccddeeff00";
        g.__BETTER_AUTH_DEV_SECRET = fallback;
        return fallback;
    }
}

const trusted = [
    process.env.URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.NODE_ENV !== "production" ? process.env.URL : undefined,
    // Ajouter l'URL de base pour BetterAuth
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.URL,
].filter((origin): origin is string => Boolean(origin));

export const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: "mysql" }),
    trustedOrigins: trusted,
    emailAndPassword: { enabled: true },
    secret: getAuthSecret(),
    baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === "production" ? `https://${process.env.VERCEL_URL}` : process.env.URL),
});
