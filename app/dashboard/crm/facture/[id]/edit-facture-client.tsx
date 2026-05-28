"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { findFactureById, updateFactureAction } from "../actions";
import { CreateManualFactureSchema, ManualFacture } from "@/models/mvc";
import { useAction } from "next-safe-action/hooks";
import { format } from "date-fns";

const FormSchema = CreateManualFactureSchema.extend({
  dueInDays: z.number(),
  currency: z.string(),
  taxRate: z.number(),
  otherFees: z.number(),
});

type FormData = z.infer<typeof FormSchema>;

interface EditFactureClientProps {
  factureId: string;
}

export default function EditFactureClient({ factureId }: EditFactureClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { executeAsync, status } = useAction(updateFactureAction);
  const [factureMeta, setFactureMeta] = useState<ManualFacture | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      invoiceNumber: "",
      invoiceDate: new Date(),
      vendorName: "",
      vendorAddress: "",
      vendorTaxNumber: "",
      clientName: "",
      clientAddress: "",
      clientTaxNumber: "",
      purchaseOrder: "",
      dueInDays: 7,
      currency: "USD",
      notes: "",
      taxRate: 0,
      otherFees: 0,
      lines: [{ description: "", unit: "", quantity: 1, unitPrice: 0 }],
    } as FormData,
  });

  const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: "lines" });

  useEffect(() => {
    (async () => {
      const result = await findFactureById(factureId);
      if (!result.success || !result.result) {
        toast({ variant: "destructive", title: "Erreur", description: result.failure || "Facture introuvable." });
        router.push("/dashboard/crm/facture");
        return;
      }
      const facture = result.result;
      form.reset({
        invoiceNumber: facture.invoiceNumber,
        invoiceDate: facture.invoiceDate,
        vendorName: facture.vendorName,
        vendorAddress: facture.vendorAddress || "",
        vendorTaxNumber: facture.vendorTaxNumber || "",
        clientName: facture.clientName,
        clientAddress: facture.clientAddress || "",
        clientTaxNumber: facture.clientTaxNumber || "",
        purchaseOrder: facture.purchaseOrder || "",
        dueInDays: facture.dueInDays,
        currency: facture.currency,
        notes: facture.notes || "",
        taxRate: facture.taxRate,
        otherFees: facture.otherFees,
        lines: facture.lines,
      });
      replace(facture.lines.length ? facture.lines : [{ description: "", unit: "", quantity: 1, unitPrice: 0 }]);
      setFactureMeta(facture);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factureId]);

  const totals = form.watch("lines").reduce(
    (acc, line) => ({ subtotal: acc.subtotal + Number(line.quantity || 0) * Number(line.unitPrice || 0) }),
    { subtotal: 0 }
  );
  const taxAmount = (totals.subtotal * (form.watch("taxRate") ?? 0)) / 100;
  const grandTotal = totals.subtotal + taxAmount + (form.watch("otherFees") ?? 0);

  const onSubmit = async (data: FormData) => {
    if (!factureMeta) return;
    const payload: ManualFacture = {
      ...factureMeta,
      ...data,
      invoiceDate: data.invoiceDate,
      updatedAt: new Date(),
    };
    const result = await executeAsync(payload);
    if (result?.data?.success) {
      toast({ title: "Facture mise à jour" });
      router.push("/dashboard/crm/facture");
    } else {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: result?.data?.failure || "Mise à jour impossible.",
      });
    }
  };

  const isSubmitting = status === "executing";

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modifier la facture</h1>
          <p className="text-muted-foreground">Mettez à jour les informations puis enregistrez.</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>En-tête facture</CardTitle>
            <CardDescription>Informations générales</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <Label>Numéro *</Label>
              <Input {...form.register("invoiceNumber")} />
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input
                type="date"
                value={format(form.watch("invoiceDate"), "yyyy-MM-dd")}
                onChange={(event) => form.setValue("invoiceDate", new Date(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Nom vendeur *</Label>
              <Input {...form.register("vendorName")} />
            </div>
            <div className="space-y-2">
              <Label>N° impôt vendeur</Label>
              <Input {...form.register("vendorTaxNumber")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Adresse vendeur</Label>
              <Textarea rows={2} {...form.register("vendorAddress")} />
            </div>
            <div className="space-y-2">
              <Label>Client *</Label>
              <Input {...form.register("clientName")} />
            </div>
            <div className="space-y-2">
              <Label>N° client</Label>
              <Input {...form.register("clientTaxNumber")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Adresse client</Label>
              <Textarea rows={2} {...form.register("clientAddress")} />
            </div>
            <div className="space-y-2">
              <Label>Bon de commande</Label>
              <Input {...form.register("purchaseOrder")} />
            </div>
            <div className="space-y-2">
              <Label>Échéance (jours)</Label>
              <Input type="number" {...form.register("dueInDays", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Devise</Label>
              <Input {...form.register("currency")} />
            </div>
            <div className="space-y-2">
              <Label>TVA (%)</Label>
              <Input type="number" step="0.01" {...form.register("taxRate", { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label>Autres frais</Label>
              <Input type="number" step="0.01" {...form.register("otherFees", { valueAsNumber: true })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lignes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4 border p-4 rounded-lg">
                <div className="md:col-span-2 space-y-2">
                  <Label>Description *</Label>
                  <Input {...form.register(`lines.${index}.description` as const)} />
                </div>
                <div className="space-y-2">
                  <Label>Unité *</Label>
                  <Input {...form.register(`lines.${index}.unit` as const)} />
                </div>
                <div className="space-y-2">
                  <Label>Quantité *</Label>
                  <Input type="number" step="0.01" {...form.register(`lines.${index}.quantity` as const, { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Prix unitaire *</Label>
                  <Input type="number" step="0.0001" {...form.register(`lines.${index}.unitPrice` as const, { valueAsNumber: true })} />
                </div>
                <div className="md:col-span-5 flex justify-end">
                  {fields.length > 1 && (
                    <Button type="button" variant="outline" onClick={() => remove(index)} className="gap-1">
                      <Trash2 className="h-4 w-4" />
                      Retirer
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => append({ description: "", unit: "", quantity: 1, unitPrice: 0 })}
            >
              <Plus className="h-4 w-4" /> Ajouter une ligne
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Résumé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea rows={3} {...form.register("notes")} />
              </div>
              <div className="space-y-2 bg-muted/40 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span>Sous-total</span>
                  <span>
                    {totals.subtotal.toFixed(2)} {form.watch("currency")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>TVA ({form.watch("taxRate")}%)</span>
                  <span>
                    {taxAmount.toFixed(2)} {form.watch("currency")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Autres</span>
                  <span>
                    {(form.watch("otherFees") ?? 0).toFixed(2)} {form.watch("currency")}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Total TTC</span>
                  <span>
                    {grandTotal.toFixed(2)} {form.watch("currency")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? "Enregistrement..." : "Mettre à jour"}
          </Button>
        </div>
      </form>
    </div>
  );
}

