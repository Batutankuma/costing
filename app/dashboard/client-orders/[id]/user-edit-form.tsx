"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getClients } from "@/app/dashboard/clients/actions";
import { listProducts } from "@/app/dashboard/products/actions";
import { updateClientOrderAction } from "../actions";
import { Save } from "lucide-react";

const FormSchema = z.object({
  reference: z.string().min(1),
  date: z.date(),
  status: z.enum(["DRAFT", "CONFIRMED", "PARTIALLY_RECEIVED", "COMPLETED", "CANCELLED"]),
  clientId: z.string().min(1),
  produitId: z.string().min(1),
  quantity: z.number().min(0.01),
  unitPrice: z.number().min(0),
  devise: z.enum(["USD", "CDF", "EUR", "XOF"]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof FormSchema>;

export default function EditClientOrderForm({
  id,
  initial,
}: {
  id: string;
  initial: FormData;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { executeAsync, status } = useAction(updateClientOrderAction);
  const { executeAsync: executeProducts } = useAction(listProducts);
  const [clients, setClients] = useState<Array<{ id: string; name?: string; company?: string }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([]);

  const { register, handleSubmit, control, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: initial,
  });

  useEffect(() => {
    (async () => {
      const [clientsRes, productsRes] = await Promise.all([getClients(), executeProducts()]);
      setClients((clientsRes || []) as Array<{ id: string; name?: string; company?: string }>);
      setProducts((productsRes?.data?.data || []) as Array<{ id: string; name: string }>);
    })();
  }, [executeProducts]);

  const onSubmit = async (data: FormData) => {
    const result = await executeAsync({ id, ...data, notes: data.notes || null });
    if (result?.data?.success) {
      toast({ title: "Succes", description: "Bon client mis a jour." });
      router.push("/dashboard/client-orders");
      return;
    }
    toast({ variant: "destructive", title: "Erreur", description: result?.data?.failure || "Echec de mise a jour" });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations du bon client</CardTitle>
          <CardDescription>Mettez a jour les champs puis enregistrez.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div><Label>Reference</Label><Input className="h-10" {...register("reference")} /></div>
          <div><Label>Date</Label><Input className="h-10" type="date" {...register("date", { valueAsDate: true })} /></div>
          <div>
            <Label>Client</Label>
            <Controller
              control={control}
              name="clientId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10 [&>span]:truncate"><SelectValue placeholder="Selectionner..." /></SelectTrigger>
                  <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}><span className="block max-w-[320px] truncate">{c.company || c.name || "Client"}</span></SelectItem>)}</SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label>Produit</Label>
            <Controller
              control={control}
              name="produitId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10 [&>span]:truncate"><SelectValue placeholder="Selectionner..." /></SelectTrigger>
                  <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}><span className="block max-w-[320px] truncate">{p.name}</span></SelectItem>)}</SelectContent>
                </Select>
              )}
            />
          </div>
          <div><Label>Quantite</Label><Input className="h-10" type="number" step="0.01" {...register("quantity", { valueAsNumber: true })} /></div>
          <div><Label>Prix unitaire</Label><Input className="h-10" type="number" step="0.0001" {...register("unitPrice", { valueAsNumber: true })} /></div>
          <div>
            <Label>Devise</Label>
            <Controller
              control={control}
              name="devise"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="CDF">CDF</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="XOF">XOF</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div>
            <Label>Statut</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Brouillon</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmee</SelectItem>
                    <SelectItem value="PARTIALLY_RECEIVED">Partielle</SelectItem>
                    <SelectItem value="COMPLETED">Complete</SelectItem>
                    <SelectItem value="CANCELLED">Annulee</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="md:col-span-2"><Label>Notes</Label><Input className="h-10" {...register("notes")} /></div>
        </CardContent>
      </Card>
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting || status === "executing"} className="flex-1 gap-2">
          <Save className="h-4 w-4" />
          {isSubmitting || status === "executing" ? "Enregistrement..." : "Enregistrer les modifications"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard/client-orders")}>Annuler</Button>
      </div>
    </form>
  );
}
