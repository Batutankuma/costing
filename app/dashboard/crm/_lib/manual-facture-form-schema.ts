import { z } from "zod";
import { CreateManualFactureSchema } from "@/models/mvc";

export const ManualFactureFormSchema = CreateManualFactureSchema.omit({
  dueInDays: true,
  currency: true,
  taxRate: true,
  otherFees: true,
}).extend({
  invoiceDate: z.date({ required_error: "Date requise" }),
  currency: z.string().min(1, "Devise requise"),
  dueInDays: z.number().min(0, "Échéance invalide"),
  taxRate: z.number().min(0, "TVA invalide").max(100, "TVA invalide"),
  otherFees: z.number().min(0, "Frais invalides"),
});

export type ManualFactureFormData = z.infer<typeof ManualFactureFormSchema>;
