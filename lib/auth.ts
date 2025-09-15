import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";

// Ensure a valid secret for Better Auth (hex string). Prefer env, fallback to dev-only random.
function getAuthSecret(): string {
    const fromEnv = process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (fromEnv && /^[0-9a-fA-F]+$/.test(fromEnv)) return fromEnv;
    // Dev fallback: generate ephemeral hex secret
    try {
        const { randomBytes } = require("node:crypto");
        return randomBytes(32).toString("hex");
    } catch {
        // Last resort: fixed short secret (not for prod)
        return "a1b2c3d4e5f60718293a4b5c6d7e8f90112233445566778899aabbccddeeff00";
    }
}

export const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: "mysql" }),
    trustedOrigins: [
        "http://localhost:3000",
        "http://169.254.12.24:3000",
    ],
    emailAndPassword: { enabled: true },
    secret: getAuthSecret(),
});
