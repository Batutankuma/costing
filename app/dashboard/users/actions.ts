// actions for user
"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { revalidatePath } from "next/cache";
import { handlePrismaError } from "@/middlewares/message_error";
import { hasAccess } from "@/lib/role-access";
import { CreateUserSchema, UpdateUserSchema } from "@/models/mvc.pruned";
import { auth } from "@/lib/authx";
import { generateTemporaryPassword, hashPassword } from "@/lib/auth-password";
import { z } from "zod";

const CREDENTIAL_PROVIDER_IDS = ["credential", "email", "credentials", "password"] as const;

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
      revalidatePath("/dashboard/users");
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

      const newPassword = generateTemporaryPassword();
      const hash = await hashPassword(newPassword);

      const updated = await prisma.account.updateMany({
        where: {
          userId: user.id,
          providerId: { in: [...CREDENTIAL_PROVIDER_IDS] },
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
              providerId: "credential",
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

// Création admin via Better Auth (même hash / structure que l'inscription publique)
export const adminCreateWithPasswordAction = actionClient
  .schema(CreateUserSchema)
  .action(async ({ parsedInput }) => {
    try {
      const role: string | null = null;
      if (!hasAccess(role, "user")) {
        return { failure: "Accès refusé : vous n'avez pas le droit de créer un utilisateur." };
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: parsedInput.email },
      });

      if (existingUser) {
        return { failure: "Un utilisateur avec cet email existe déjà." };
      }

      const generatedPassword = generateTemporaryPassword();

      let signUpResult: Awaited<ReturnType<typeof auth.api.signUpEmail>>;
      try {
        signUpResult = await auth.api.signUpEmail({
          body: {
            name: parsedInput.name,
            email: parsedInput.email,
            password: generatedPassword,
          },
        });
      } catch (signUpError) {
        const message =
          signUpError instanceof Error
            ? signUpError.message
            : "Impossible de créer le compte utilisateur.";
        return { failure: message };
      }

      if (!signUpResult?.user) {
        return {
          failure:
            "Impossible de créer le compte. Vérifiez que l'email est valide et que l'inscription est activée.",
        };
      }

      const now = new Date();
      await prisma.user.update({
        where: { id: signUpResult.user.id },
        data: {
          role: parsedInput.role,
          emailVerified: parsedInput.emailVerified ?? false,
          updatedAt: now,
        },
      });

      revalidatePath("/dashboard/users");
      return {
        success: { ok: true, password: generatedPassword, userId: signUpResult.user.id },
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { failure: "Validation failed: " + error.errors.map((e) => e.message).join(", ") };
      }
      const errorMessage = handlePrismaError(error);
      console.error("Erreur lors de la création de l'utilisateur:", error);
      return { failure: errorMessage };
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
      revalidatePath("/dashboard/users");
      revalidatePath(`/dashboard/users/${parsedInput.id}`);
      revalidatePath(`/dashboard/users/views/${parsedInput.id}`);
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
    revalidatePath("/dashboard/users");
    return { success: true, message: "Utilisateur supprimé avec succès." };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

/**
 * @description Supprime un utilisateur par son ID via actionClient (pour compatibilité avec delete dialog).
 */
export const deleteUser = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      const { id } = parsedInput;
      
      // Vérifier si l'utilisateur existe
      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) {
        return { failure: "Utilisateur introuvable." };
      }
      
      await prisma.user.delete({ where: { id } });
      revalidatePath("/dashboard/users");
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression de l'utilisateur:", error);
      return { failure: "Impossible de supprimer l'utilisateur." };
    }
  });


