"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { getDepotFull, updateDepot, updateDepotProducts } from "../actions";
import { getProducts } from "@/app/dashboard/products/actions";

const DepotEditSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  type: z.enum(["OWNED", "EXTERNAL"]),
  location: z.string().optional().nullable(),
});

type DepotEditData = z.infer<typeof DepotEditSchema>;

export default function EditDepotClient({ depotId }: { depotId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<DepotEditData>({ resolver: zodResolver(DepotEditSchema), defaultValues: { type: "OWNED" } });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const depot = await getDepotFull(depotId);
      if (depot) form.reset({ name: depot.name, type: depot.type, location: depot.location ?? "" });
      setLoading(false);
    })();
  }, [depotId, form]);

  const onSubmit = async (data: DepotEditData) => {
    try {
      setSaving(true);
      const res = await updateDepot({ id: depotId, ...data } as any);
      if ((res as any)?.success) {
        toast({ title: "Succès", description: "Dépôt mis à jour" });
        router.push(`/dashboard/depots/views/${depotId}`);
      } else {
        toast({ title: "Erreur", description: (res as any)?.failure ?? "Mise à jour impossible", variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 max-w-6xl mx-auto">Chargement...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/depots">
            <Button variant="outline" size="sm">
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Modifier le Dépôt</h1>
            <p className="text-muted-foreground">Mettez à jour le nom, le type et la localisation</p>
          </div>
        </div>
      </div>

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
                <Input id="name" {...form.register("name")} placeholder="Ex: Dépôt Central" aria-invalid={!!form.formState.errors.name} />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OWNED">Interne</SelectItem>
                    <SelectItem value="EXTERNAL">Externe</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Choisissez si le dépôt est interne (propre) ou externe (partenaire).</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Localisation</Label>
                <Input id="location" placeholder="Ex: Lubumbashi" {...form.register("location")} />
                <p className="text-xs text-muted-foreground">Optionnel</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Produits liés</CardTitle>
            <CardDescription>Liste des produits actuellement attachés à ce dépôt</CardDescription>
          </CardHeader>
          <CardContent>
            <LinkedProductsEditor depotId={depotId} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/depots">
            <Button type="button" variant="outline" disabled={saving}>
              Annuler
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function LinkedProductsEditor({ depotId }: { depotId: string }) {
  const { toast } = useToast();
  const [rows, setRows] = useState<Array<{ productId: string; name: string; unit: string; quantity: number }>>([]);
  const [catalog, setCatalog] = useState<Array<{ id: string; name: string; unit: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const depot = await getDepotFull(depotId);
      const products = await getProducts();
      const initial = (depot?.products ?? []).map((dp: any) => ({
        productId: dp.productId,
        name: dp.product?.name ?? "",
        unit: dp.product?.unit ?? "",
        quantity: dp.quantity ?? 0,
      }));
      setRows(initial);
      setCatalog((products ?? []).map((p: any) => ({ id: p.id, name: p.name, unit: p.unit })));
      setLoading(false);
    })();
  }, [depotId]);

  const updateRow = (idx: number, patch: Partial<{ productId: string; name: string; unit: string; quantity: number }>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };
  const addRow = () => setRows((prev) => [...prev, { productId: "", name: "", unit: "", quantity: 0 }]);
  const removeRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx));

  const onSave = async () => {
    setSaving(true);
    try {
      const valid = rows.filter((r) => r.productId);
      const res = await updateDepotProducts({ depotId, items: valid } as any);
      if ((res as any)?.success) toast({ title: "Succès", description: "Produits mis à jour" });
      else toast({ title: "Erreur", description: (res as any)?.failure ?? "Mise à jour impossible", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Chargement...</div>;

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b bg-muted/50">
              <th className="py-2 px-3">Produit</th>
              <th className="py-2 px-3">Unité</th>
              <th className="py-2 px-3 text-right">Quantité</th>
              <th className="py-2 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="py-6 px-3 text-center text-muted-foreground" colSpan={4}>
                  Aucun produit, ajoutez‑en un
                </td>
              </tr>
            )}
            {rows.map((r, i) => (
              <tr key={`${r.productId}-${i}`} className="border-b last:border-0">
                <td className="py-2 px-3 w-[40%]">
                  <Select
                    value={r.productId}
                    onValueChange={(val) => {
                      const meta = catalog.find((p) => p.id === val);
                      updateRow(i, { productId: val, name: meta?.name ?? "", unit: meta?.unit ?? "" });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {catalog.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="py-2 px-3 align-middle">{r.unit || "—"}</td>
                <td className="py-2 px-3 text-right">
                  <Input
                    type="number"
                    step="any"
                    value={r.quantity as any}
                    onChange={(e) => updateRow(i, { quantity: e.target.value === "" ? 0 : Number(e.target.value) })}
                  />
                </td>
                <td className="py-2 px-3 text-right">
                  <Button variant="outline" size="sm" onClick={() => removeRow(i)}>
                    Retirer
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={addRow}>
          Ajouter un produit
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? "Enregistrement..." : "Enregistrer les produits"}
        </Button>
      </div>
    </div>
  );
}

