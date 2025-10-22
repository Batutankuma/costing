import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";

// Fonction simplifiée pour obtenir le secret
function getAuthSecret(): string {
    const secret = process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET;
    
    if (!secret) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("BETTER_AUTH_SECRET is required in production");
        }
        // En développement, utilise un secret par défaut (à remplacer en prod)
        console.warn("⚠️ Using default secret for development - replace BETTER_AUTH_SECRET for production");
        return "dev-secret-00000000000000000000000000000000000000000000000000";
    }
    
    return secret;
}

// Fonction pour obtenir l'URL de base
function getBaseURL(): string {
    // Priorité à BETTER_AUTH_URL
    if (process.env.BETTER_AUTH_URL) {
        return process.env.BETTER_AUTH_URL;
    }
    
    // En production sur Vercel
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    
    // Fallback pour le développement
    return process.env.URL || "http://localhost:3000";
}

// Fonction pour les origines de confiance
function getTrustedOrigins(): string[] {
    const baseURL = getBaseURL();
    const origins = new Set<string>();
    
    // Ajoute l'URL de base
    origins.add(baseURL);
    
    // Ajoute les variantes localhost en développement
    if (process.env.NODE_ENV !== "production") {
        origins.add("http://localhost:3000");
        origins.add("http://127.0.0.1:3000");
    }
    
    // Ajoute les URLs supplémentaires depuis les variables d'environnement
    if (process.env.NEXT_PUBLIC_APP_URL) {
        origins.add(process.env.NEXT_PUBLIC_APP_URL);
    }
    
    if (process.env.VERCEL_URL) {
        origins.add(`https://${process.env.VERCEL_URL}`);
    }
    
    return Array.from(origins).filter(origin => 
        origin && typeof origin === "string" && origin.length > 0
    );
}

export const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: "mysql" }),
    trustedOrigins: getTrustedOrigins(),
    emailAndPassword: { 
        enabled: true 
    },
    secret: getAuthSecret(),
    baseURL: getBaseURL(),
});