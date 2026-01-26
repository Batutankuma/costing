import { z } from "zod";
import { actionClient } from "@/lib/safe-action";

// Schéma de validation pour la réinitialisation du mot de passe
const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, { message: "Le jeton est manquant." }),
    password: z.string().min(8, { message: "Le mot de passe doit contenir au moins 8 caractères." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export const resetPasswordAction = actionClient
  .schema(ResetPasswordSchema)
  .action(async ({ parsedInput: { token } }) => {
    try {
      // Ici, l'infrastructure de stockage des jetons n'existe pas encore dans Prisma (passwordResetToken).
      // On log simplement la demande pour débogage et on renvoie un message explicite.
   
      return {
        success: false,
        failure: "La réinitialisation de mot de passe n'est pas encore entièrement configurée sur ce serveur. Veuillez contacter l'administrateur.",
      };
    } catch (error) {
      console.error("Erreur lors de la réinitialisation du mot de passe:", error);
      return { success: false, failure: "Une erreur inattendue est survenue. Veuillez réessayer." };
    }
  });
