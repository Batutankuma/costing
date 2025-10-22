"use client";

import { createAuthClient } from "better-auth/react";

const getBaseURL = () => {
  // 1. Priorité à la variable d'environnement publique
  if (process.env.NEXT_PUBLIC_BETTER_AUTH_URL) {
    return process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
  }
  
  // 2. En production sur Vercel
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  
  // 3. Fallback pour le développement
  return "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});