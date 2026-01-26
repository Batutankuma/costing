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
import { findFactureDgiById, updateFactureDgiAction } from "../actions";
import { useAction } from "next-safe-action/hooks";
import { format } from "date-fns";

const FormSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string().min(1, "Numéro requis"),
  invoiceDate: z.date(),
  clientName: z.string().min(1, "Nom client requis"),
  clientNif: z.string().optional(),
  clientAddress: z.string().optional(),
  clientRccm: z.string().optional(),
  clientId: z.string().optional(),
  currency: z.enum(["USD", "CDF"]),
  notes: z.string().optional(),
  lines: z.array(
    z.object({
      description: z.string().min(1, "Description requise"),
      unit: z.string().optional(),
      quantity: z.number().min(0.001, "Quantité > 0"),
      unitPrice: z.number().min(0, "Prix >= 0"),
      tvaRate: z.number(),
    })
  ).min(1, "Ajoutez au moins une ligne"),
});

type FormData = z.infer<typeof FormSchema>;

interface EditFactureDgiClientProps {
  factureDgiId: string;
}

export default function EditFactureDgiClient({ factureDgiId }: EditFactureDgiClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { executeAsync, status } = useAction(updateFactureDgiAction);
  const [loading, setLoading] = useState(true);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      id: factureDgiId,
      invoiceNumber: "",
      invoiceDate: new Date(),
      clientName: "",
      clientNif: "",
      clientAddress: "",
      clientRccm: "",
      clientId: "",
      currency: "USD",
      notes: "",
      lines: [{ description: "", unit: "", quantity: 1, unitPrice: 0, tvaRate: 16 }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: "lines" });

  useEffect(() => {
    (async () => {
      const result = await findFactureDgiById(factureDgiId);
      if (!result) {
        toast({ variant: "destructive", title: "Erreur", description: "Facture DGI introuvable." });
        router.push("/dashboard/crm/facture-dgi");
        return;
      }

      form.reset({
        id: result.id,
        invoiceNumber: result.invoiceNumber,
        invoiceDate: result.invoiceDate,
        clientName: result.clientName,
        clientNif: result.clientNif || "",
        clientAddress: result.clientAddress || "",
        clientRccm: result.clientRccm || "",
        clientId: result.clientId || "",
        currency: result.currency as "USD" | "CDF",
        notes: result.notes || "",
        lines: result.lines && result.lines.length > 0
          ? result.lines.map((line: any) => ({
            description: line.description,
            unit: line.unit || "",
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            tvaRate: line.tvaRate,
          }))
          : [{ description: "", unit: "", quantity: 1, unitPrice: 0, tvaRate: 16 }],
      });

      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factureDgiId]);

  const totals = form.watch("lines").reduce(
    (acc, line) => {
      const lineHT = Number(line.quantity || 0) * Number(line.unitPrice || 0);
      const lineTVA = lineHT * (Number(line.tvaRate || 0) / 100);
      return {
        totalHT: acc.totalHT + lineHT,
        totalTVA: acc.totalTVA + lineTVA,
      };
    },
    { totalHT: 0, totalTVA: 0 }
  );
  const totalTTC = totals.totalHT + totals.totalTVA;

  const onSubmit = async (data: FormData) => {
    const result = await executeAsync(data);
    if (result?.data?.success) {
      toast({ title: "Facture DGI mise à jour" });
      router.push("/dashboard/crm/facture-dgi");
    } else {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: result?.serverError || "Mise à jour impossible.",
      });
    }
  };

  const isSubmitting = status === "executing";

  if (loading) {
    return (
      <div className="p-6">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modifier la facture DGI</h1>
          <p className="text-muted-foreground">Mettez à jour les informations puis enregistrez.</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>En-tête facture DGI</CardTitle>
            <CardDescription>Informations générales</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Numéro *</Label>
              <Input {...form.register("invoiceNumber")} />
              {form.formState.errors.invoiceNumber && (
                <p className="text-sm text-red-500">{form.formState.errors.invoiceNumber.message}</p>
              )}
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
              <Label>Nom client *</Label>
              <Input {...form.register("clientName")} />
              {form.formState.errors.clientName && (
                <p className="text-sm text-red-500">{form.formState.errors.clientName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>NIF client</Label>
              <Input {...form.register("clientNif")} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Adresse client</Label>
              <Textarea rows={2} {...form.register("clientAddress")} />
            </div>
            <div className="space-y-2">
              <Label>RCCM client</Label>
              <Input {...form.register("clientRccm")} />
            </div>
            <div className="space-y-2">
              <Label>Devise</Label>
              <select {...form.register("currency")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="USD">USD</option>
                <option value="CDF">CDF</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lignes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 border p-4 rounded-lg">
                <div className="md:col-span-2 space-y-2">
                  <Label>Description *</Label>
                  <Input {...form.register(`lines.${index}.description` as const)} />
                </div>
                <div className="space-y-2">
                  <Label>Unité</Label>
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
                <div className="space-y-2">
                  <Label>TVA (%)</Label>
                  <Input type="number" step="0.01" {...form.register(`lines.${index}.tvaRate` as const, { valueAsNumber: true })} />
                </div>
                <div className="md:col-span-6 flex justify-end">
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
              onClick={() => append({ description: "", unit: "", quantity: 1, unitPrice: 0, tvaRate: 16 })}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea rows={3} {...form.register("notes")} />
              </div>
              <div className="space-y-2 bg-muted/40 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span>Total HT</span>
                  <span>
                    {totals.totalHT.toFixed(2)} {form.watch("currency")}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total TVA</span>
                  <span>
                    {totals.totalTVA.toFixed(2)} {form.watch("currency")}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <span>Total TTC</span>
                  <span>
                    {totalTTC.toFixed(2)} {form.watch("currency")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : "Mettre à jour"}
          </Button>
        </div>
      </form>
    </div>
  );
}
