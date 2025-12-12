"use client";

import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { createDepot } from "../actions";
import { useState } from "react";

const DepotFormSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  type: z.enum(["OWNED", "EXTERNAL"]),
  location: z.string().optional(),
  products: z.array(
    z.object({
      name: z.string().min(1, "Nom du produit requis"),
      unit: z.enum([
        "KG",
        "G",
        "L",
        "ML",
        "TONNE",
        "PIECE",
        "BOITE",
        "CAISSON",
        "POUCE",
        "METRE",
        "METRE_CARRE",
        "METRE_CUBE",
        "METRE_LINEAIRE",
      ]),
      quantity: z.number().min(0),
    })
  ).min(1),
});

type DepotFormData = z.infer<typeof DepotFormSchema>;

export default function DepotCreateForm({ suggestions }: { suggestions: Array<{ id: string; name: string; unit: string }> }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const form = useForm<DepotFormData>({
    resolver: zodResolver(DepotFormSchema),
    defaultValues: { type: "OWNED", products: [{ name: "", unit: "PIECE", quantity: 0 }] },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "products" });

  const onSubmit = async (data: DepotFormData) => {
    setSaving(true);
    try {
      await createDepot(data);
      router.push("/dashboard/depots");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Informations du dépôt</CardTitle>
          <CardDescription>Nom, type et localisation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input id="name" {...form.register("name")} placeholder="Ex: Dépôt Central" />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v as DepotFormData["type"])}>
                <SelectTrigger><SelectValue placeholder="Sélectionner le type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OWNED">Interne</SelectItem>
                  <SelectItem value="EXTERNAL">Externe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localisation</Label>
              <Input id="location" {...form.register("location")} placeholder="Ex: Lubumbashi" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produits</CardTitle>
          <CardDescription>Au moins un produit est requis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div className="space-y-2 md:col-span-2">
                <Label>Nom du produit</Label>
                <Input
                  value={form.watch(`products.${index}.name`) || ""}
                  onChange={(e) => form.setValue(`products.${index}.name`, e.target.value)}
                  list={`product-suggestions-${index}`}
                  placeholder="Ex: Diesel"
                />
                <datalist id={`product-suggestions-${index}`}>
                  {suggestions.map((s) => (
                    <option key={s.id} value={s.name} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label>Unité</Label>
                <Select
                  value={form.watch(`products.${index}.unit`)}
                  onValueChange={(v) => form.setValue(`products.${index}.unit`, v as DepotFormData["products"][number]["unit"])}
                >
                  <SelectTrigger><SelectValue placeholder="Unité" /></SelectTrigger>
                  <SelectContent>
                    {[
                      "KG","G","L","ML","TONNE","PIECE","BOITE","CAISSON","POUCE","METRE","METRE_CARRE","METRE_CUBE","METRE_LINEAIRE",
                    ].map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantité</Label>
                <Input type="number" step="any"
                  value={form.watch(`products.${index}.quantity`)}
                  onChange={(e) => form.setValue(`products.${index}.quantity`, e.target.value === "" ? 0 : Number(e.target.value))}
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => remove(index)}>Retirer</Button>
                {index === fields.length - 1 && (
                  <Button type="button" onClick={() => append({ name: "", unit: "PIECE", quantity: 0 })}>Ajouter</Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => history.back()} disabled={saving}>Annuler</Button>
        <Button type="submit" disabled={saving}>{saving ? "Création..." : "Créer le Dépôt"}</Button>
      </div>
    </form>
  );
}


