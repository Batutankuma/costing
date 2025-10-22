"use client";

import { createAuthClient } from "better-auth/react";

const getClientBaseURL = () => {
  // En production, utilise l'URL actuelle du navigateur
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  
  // Fallback pour SSR
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }
  
  return "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getClientBaseURL(),
});