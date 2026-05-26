import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { hashPassword, verifyPassword } from "./auth-password";

function getAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("BETTER_AUTH_SECRET is required in production");
    }
    console.warn(
      "Using default secret for development - replace BETTER_AUTH_SECRET for production"
    );
    return "dev-secret-00000000000000000000000000000000000000000000000000";
  }

  return secret;
}

function getBaseURL(): string {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return process.env.URL || "http://localhost:3000";
}

function getTrustedOrigins(): string[] {
  const origins = new Set<string>();
  const addOrigin = (value?: string) => {
    if (!value || typeof value !== "string") return;
    const normalized = value.trim().replace(/\/+$/, "");
    if (normalized) origins.add(normalized);
  };

  addOrigin(getBaseURL());
  addOrigin(process.env.URL_LOCAL);
  addOrigin(process.env.URL);
  addOrigin(process.env.NEXT_PUBLIC_APP_URL);
  addOrigin(process.env.BETTER_AUTH_URL);
  addOrigin("http://localhost:3000");
  addOrigin("http://127.0.0.1:3000");

  if (process.env.VERCEL_URL) {
    addOrigin(`https://${process.env.VERCEL_URL}`);
  }

  const extraOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS;
  if (extraOrigins) {
    for (const origin of extraOrigins.split(",")) {
      addOrigin(origin);
    }
  }

  return Array.from(origins);
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  trustedOrigins: getTrustedOrigins(),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    autoSignIn: true,
    password: {
      hash: hashPassword,
      verify: async ({ hash, password }) => verifyPassword(hash, password),
    },
  },
  secret: getAuthSecret(),
  baseURL: getBaseURL(),
});
