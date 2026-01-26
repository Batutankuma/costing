import { z } from "zod";
import { actionClient } from "@/lib/safe-action"; // Assumant le chemin pour next-safe-action
import db from "@/lib/prisma"; // Assumant le chemin pour le client Prisma
import crypto from "crypto";

// Schéma de validation pour l'e-mail
const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: "Adresse e-mail invalide." }),
});

export const sendResetPasswordEmailAction = actionClient
  .schema(ForgotPasswordSchema)
  .action(async ({ parsedInput: { email } }) => {
    try {
      // 1. Vérifier si l'utilisateur existe
      const user = await db.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Ne pas révéler si l'e-mail existe pour des raisons de sécurité
        return { success: true, message: "Si votre adresse e-mail existe dans notre système, vous recevrez un lien de réinitialisation." };
      }

      // 2. Générer un jeton de réinitialisation unique (non stocké en base pour l’instant)
      const token = crypto.randomBytes(32).toString("hex");

      // 3. Construire le lien de réinitialisation
      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;

      // 5. Envoyer l'e-mail (implémentation de base, à adapter avec un service d'envoi d'e-mails réel)
     
      // Ici, vous intégreriez votre service d'envoi d'e-mails (ex: nodemailer, SendGrid, Resend)
      // await sendEmail({
      //   to: email,
      //   subject: "Réinitialisation de votre mot de passe",
      //   html: `<p>Cliquez sur ce lien pour réinitialiser votre mot de passe : <a href="${resetLink}">Réinitialiser le mot de passe</a></p>`,
      // });

      return { success: true, message: "Si votre adresse e-mail existe dans notre système, vous recevrez un lien de réinitialisation." };
    } catch (error) {
      console.error("Erreur lors de la demande de réinitialisation du mot de passe:", error);
      return { success: false, failure: "Une erreur inattendue est survenue. Veuillez réessayer." };
    }
  });
