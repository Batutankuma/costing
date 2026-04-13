import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";

// Ensure a stable hex secret (64 chars). Prefer env; otherwise cache a dev-only secret in globalThis
function getAuthSecret(): string {
    const fromEnv = process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (fromEnv && /^[0-9a-fA-F]{64}$/.test(fromEnv)) return fromEnv;
    const g = globalThis as { __BETTER_AUTH_DEV_SECRET?: string };
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

function toOrigin(value?: string): string | undefined {
    if (!value) return undefined;
    try {
        return new URL(value).origin;
    } catch {
        return undefined;
    }
}

const baseURL =
    process.env.BETTER_AUTH_URL ||
    process.env.URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

const trusted = Array.from(
    new Set(
        [
            toOrigin(process.env.BETTER_AUTH_URL),
            toOrigin(process.env.URL),
            toOrigin(process.env.NEXT_PUBLIC_APP_URL),
            toOrigin(baseURL),
            process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
            process.env.NODE_ENV !== "production" ? "http://localhost:3000" : undefined,
            process.env.NODE_ENV !== "production" ? "http://127.0.0.1:3000" : undefined,
        ].filter((origin): origin is string => Boolean(origin))
    )
);

const appName = process.env.APP_NAME || "AAGS";

async function sendResetPasswordEmail({
    user,
    url,
}: {
    user: { email?: string | null; name?: string | null };
    url: string;
}) {
    const email = user.email;
    if (!email) {
        console.warn("[better-auth] Aucun email trouvé pour l'utilisateur lors de la réinitialisation du mot de passe.");
        return;
    }

    const resendKey = process.env.RESEND_API_KEY;
    const resendFrom = process.env.RESEND_FROM_EMAIL;

    if (resendKey && resendFrom) {
        try {
            const response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${resendKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from: resendFrom,
                    to: email,
                    subject: `${appName} – Réinitialisation du mot de passe`,
                    html: [
                        `<p>Bonjour${user.name ? ` ${user.name}` : ""},</p>`,
                        "<p>Vous avez demandé la réinitialisation de votre mot de passe.</p>",
                        `<p>Cliquez sur le lien suivant pour définir un nouveau mot de passe : <a href="${url}">${url}</a></p>`,
                        "<p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer ce message.</p>",
                        `<p>L'équipe ${appName}</p>`,
                    ].join(""),
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "Impossible d'envoyer l'email de réinitialisation.");
            }
            return;
        } catch (error) {
            console.error("[better-auth] Échec de l'envoi de l'email de réinitialisation via Resend.", error);
            throw error;
        }
    }

    console.info(
        `[better-auth] Lien de réinitialisation pour ${email}: ${url}. Configurer RESEND_API_KEY et RESEND_FROM_EMAIL pour envoyer de vrais emails.`
    );
}

export const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    trustedOrigins: trusted,
    baseURL,
    emailAndPassword: {
        enabled: true,
    },
    secret: getAuthSecret(),
    logger: {
        level: "debug",
        disabled: false,
    },
});
