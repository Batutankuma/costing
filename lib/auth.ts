import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";

// Fonction simplifiée pour obtenir le secret
function getAuthSecret(): string {
    const secret = process.env.BETTER_AUTH_SECRET;
    
    if (!secret) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("BETTER_AUTH_SECRET is required in production");
        }
        // En développement, utilise un secret par défaut
        console.warn("⚠️ Using default secret for development - replace BETTER_AUTH_SECRET for production");
        return "dev-secret-00000000000000000000000000000000000000000000000000";
    }
    
    return secret;
}

// Fonction pour obtenir l'URL de base - CORRIGÉE
function getBaseURL(): string {
    // En production sur Vercel - utilise toujours l'URL Vercel
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    
    // Variable d'environnement explicite (pour override)
    if (process.env.BETTER_AUTH_URL) {
        return process.env.BETTER_AUTH_URL;
    }
    
    // Développement local
    return "http://localhost:3000";
}

// Fonction pour les origines de confiance - CORRIGÉE
function getTrustedOrigins(): string[] {
    const origins = new Set<string>();
    
    // URL de base
    const baseURL = getBaseURL();
    origins.add(baseURL);
    
    // URLs Vercel
    if (process.env.VERCEL_URL) {
        origins.add(`https://${process.env.VERCEL_URL}`);
        // Ajoute aussi sans https au cas où
        origins.add(`http://${process.env.VERCEL_URL}`);
    }
    
    // URLs de développement
    origins.add("http://localhost:3000");
    origins.add("http://127.0.0.1:3000");
    origins.add("http://localhost:3001");
    
    // URLs supplémentaires
    if (process.env.NEXT_PUBLIC_APP_URL) {
        origins.add(process.env.NEXT_PUBLIC_APP_URL);
    }
    
    // Ajoute l'URL actuelle en production
    if (process.env.NODE_ENV === "production" && process.env.VERCEL_URL) {
        origins.add(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL}`);
    }

    return Array.from(origins).filter(origin => 
        origin && typeof origin === "string" && origin.length > 0
    );
}

export const auth = betterAuth({
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    trustedOrigins: getTrustedOrigins(),
    emailAndPassword: { 
        enabled: true 
    },
    secret: getAuthSecret(),
    baseURL: getBaseURL(),
});

// Export pour le débogage
if (process.env.NODE_ENV !== "production") {
    console.log("🔐 Better Auth Configuration:");
    console.log("Base URL:", getBaseURL());
    console.log("Trusted Origins:", getTrustedOrigins());
    console.log("Has Secret:", !!getAuthSecret());
}