"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === "production" ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : process.env.URL),
});


