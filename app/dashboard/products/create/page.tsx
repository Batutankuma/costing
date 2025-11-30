"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createProduct } from "../actions";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const ProductSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  unit: z.enum([
    "KG","G","L","ML","TONNE","PIECE","BOITE","CAISSON","POUCE","METRE","METRE_CARRE","METRE_CUBE","METRE_LINEAIRE",
  ]),
  code: z.string().optional(),
});

type ProductFormData = z.infer<typeof ProductSchema>;

export default function CreateProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const form = useForm<ProductFormData>({ resolver: zodResolver(ProductSchema), defaultValues: { unit: "PIECE" } });

  const onSubmit = async (data: ProductFormData) => {
    try {
      setSaving(true);
      const res = await createProduct(data as any);
      if ((res as any)?.failure) {
        toast({ title: "Erreur", description: (res as any).failure, variant: "destructive" });
        return;
      }
      toast({ title: "Succès", description: "Produit créé" });
      router.push("/dashboard/products");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Nouveau Produit</h1>
        <p className="text-muted-foreground">Créer un produit</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Informations du produit</CardTitle>
            <CardDescription>Nom, unité et code</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input id="name" {...form.register("name")} placeholder="Ex: Diesel" />
              {form.formState.errors.name && (<p className="text-sm text-destructive">{form.formState.errors.name.message}</p>)}
            </div>
            <div className="space-y-2">
              <Label>Unité *</Label>
              <Select value={form.watch("unit")} onValueChange={(v) => form.setValue("unit", v as any)}>
                <SelectTrigger><SelectValue placeholder="Unité" /></SelectTrigger>
                <SelectContent>
                  {["KG","G","L","ML","TONNE","PIECE","BOITE","CAISSON","POUCE","METRE","METRE_CARRE","METRE_CUBE","METRE_LINEAIRE"].map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input id="code" {...form.register("code")} placeholder="Ex: P-001" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => history.back()} disabled={saving}>Annuler</Button>
          <Button type="submit" disabled={saving}>{saving ? "Création..." : "Créer le Produit"}</Button>
        </div>
      </form>
    </div>
  );
}


