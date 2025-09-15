// actions for user
"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { handlePrismaError } from "@/middlewares/message_error";
import { hasAccess } from "@/lib/role-access";
import { CreateUserSchema, UpdateUserSchema } from "@/models/mvc.pruned";
import { z } from "zod";

const AdminCreateWithPasswordSchema = CreateUserSchema.extend({
  password: z.string().min(6, "Mot de passe trop court"),
  confirmPassword: z.string().min(6),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export const createAction = actionClient
  .schema(CreateUserSchema)
  .action(async ({ parsedInput }) => {
    try {
      const role: string | null = null; // TODO: Better Auth session role
      if (!hasAccess(role, "user")) {
        return { failure: "Accès refusé : vous n'avez pas le droit de créer un utilisateur." };
      }

      const now = new Date();
      const result = await prisma.user.create({
        data: {
          id: globalThis.crypto?.randomUUID?.() || `${Date.now()}`,
          name: parsedInput.name,
          email: parsedInput.email,
          image: null,
          emailVerified: parsedInput.emailVerified ?? false,
          role: parsedInput.role,
          createdAt: now,
          updatedAt: now,
        },
      });
      return { success: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { failure: "Validation failed: " + error };
      }
      return { failure: handlePrismaError(error) };
    }
  });

// Admin: reset password for a user (requires bcryptjs installed)
export const adminResetPasswordAction = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      // Find user and their credential account
      const user = await prisma.user.findUnique({ where: { id: parsedInput.id } });
      if (!user) return { failure: "Utilisateur introuvable." };

      // Generate new random password
      const newPassword = Math.random().toString(36).slice(-10) + "!A1";

      // Try to import bcryptjs dynamically (so repo can build without it)
      let bcrypt: any;
      try {
        bcrypt = (await import("bcryptjs")).default ?? (await import("bcryptjs"));
      } catch {
        return { failure: "bcryptjs non installé. Exécutez: pnpm add bcryptjs" };
      }

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newPassword, salt);

      // Update existing credential-like accounts for this user
      const updated = await prisma.account.updateMany({
        where: {
          userId: user.id,
          providerId: { in: ["email", "credentials", "password"] },
        },
        data: { password: hash, updatedAt: new Date() },
      });

      if (updated.count === 0) {
        // No account found: create a credentials account for this user
        const existing = await prisma.account.findFirst({
          where: { userId: user.id },
        });
        if (existing) {
          await prisma.account.update({ where: { id: existing.id }, data: { password: hash, updatedAt: new Date() } });
        } else {
          const now = new Date();
          await prisma.account.create({
            data: {
              accountId: user.email,
              providerId: "email",
              userId: user.id,
              password: hash,
              createdAt: now,
              updatedAt: now,
            },
          });
        }
      }

      return { success: { ok: true, password: newPassword } };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { failure: "Validation failed: " + error };
      }
      return { failure: handlePrismaError(error) };
    }
  });

// Admin flow: create user via Better Auth email sign-up with password, then set role
export const adminCreateWithPasswordAction = actionClient
  .schema(CreateUserSchema)
  .action(async ({ parsedInput }) => {
    try {
      const role: string | null = null;
      if (!hasAccess(role, "user")) {
        return { failure: "Accès refusé : vous n'avez pas le droit de créer un utilisateur." };
      }

      // Generate random password
      const generatedPassword = Math.random().toString(36).slice(-10) + "!A1";

      // Build absolute base URL to avoid "Failed to parse URL" in server context
      const candidates = Array.from(new Set([
        process.env.NEXT_PUBLIC_BASE_URL?.trim(),
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://169.254.12.24:3000",
      ].filter(Boolean) as string[]));

      let lastErrorText = "";
      let createdOk = false;
      for (const baseUrl of candidates) {
        try {
          const resp = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({
              email: parsedInput.email,
              password: generatedPassword,
              name: parsedInput.name,
            }),
          });
          if (resp.ok) { createdOk = true; break; }
          try { lastErrorText = await resp.text(); } catch { lastErrorText = `HTTP ${resp.status}`; }
        } catch (err: any) {
          lastErrorText = err?.message || "Failed to fetch";
        }
      }

      if (!createdOk) {
        return { failure: `Echec de création Better Auth: ${lastErrorText}` };
      }

      // Persist/ensure Prisma user fields (role, optional image)
      await prisma.user.update({
        where: { email: parsedInput.email },
        data: {
          image: null,
          role: parsedInput.role,
          updatedAt: new Date(),
        },
      });

      return { success: { ok: true, password: generatedPassword } };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { failure: "Validation failed: " + error };
      }
      return { failure: handlePrismaError(error) };
    }
  });

export async function findByIdAction(id: string) {
  try {
    if (!id) throw new Error("L'ID de l'utilisateur est manquant.");
    const result = await prisma.user.findUnique({ where: { id } });
    if (!result) return { success: false, failure: "Utilisateur non trouvé." };
    return { success: true, result };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

export const findAllAction = actionClient
  .schema(z.void())
  .action(async () => {
    try {
      const result = await prisma.user.findMany();
      return { success: true, result };
    } catch (error) {
      return { success: false, failure: handlePrismaError(error) };
    }
  });

export const updateAction = actionClient
  .schema(UpdateUserSchema)
  .action(async ({ parsedInput }) => {
    try {
      const role: string | null = null;
      if (!hasAccess(role, "user")) {
        return { failure: "Accès refusé : vous n'avez pas le droit de modifier un utilisateur." };
      }

      const updateData = {
        name: parsedInput.name,
        email: parsedInput.email,
        image: parsedInput.image,
        emailVerified: parsedInput.emailVerified,
        role: parsedInput.role,
        updatedAt: new Date(),
      } as const;

      const result = await prisma.user.update({
        where: { id: parsedInput.id },
        data: Object.fromEntries(
          Object.entries(updateData).filter(([, v]) => v !== undefined),
        ),
      });
      return { success: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { failure: "Validation failed: " + error };
      }
      return { failure: handlePrismaError(error) };
    }
  });

export async function removeByIdAction(id: string) {
  try {
    if (!id) throw new Error("L'ID de l'utilisateur est manquant pour la suppression.");
    await prisma.user.delete({ where: { id } });
    return { success: true, message: "Utilisateur supprimé avec succès." };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}


