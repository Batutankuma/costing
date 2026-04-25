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
import { createClientOrderAction } from "../actions";
import { ArrowLeft, FileText, Save } from "lucide-react";
import Link from "next/link";

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

export default function CreateClientOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { executeAsync, status } = useAction(createClientOrderAction);
  const { executeAsync: executeProducts } = useAction(listProducts);
  const [clients, setClients] = useState<Array<{ id: string; name?: string; company?: string }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
  } = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      reference: "",
      date: new Date(),
      status: "DRAFT",
      clientId: "",
      produitId: "",
      quantity: 0,
      unitPrice: 0,
      devise: "USD",
      notes: "",
    },
  });

  useEffect(() => {
    (async () => {
      const [clientsRes, productsRes] = await Promise.all([
        getClients(),
        executeProducts(),
      ]);
      setClients((clientsRes || []) as Array<{ id: string; name?: string; company?: string }>);
      setProducts((productsRes?.data?.data || []) as Array<{ id: string; name: string }>);
    })();
  }, [executeProducts]);

  const onSubmit = async (data: FormData) => {
    const result = await executeAsync({ ...data, notes: data.notes || null });
    if (result?.data?.success) {
      toast({ title: "Succes", description: "Bon de commande client enregistre." });
      router.push("/dashboard/client-orders");
      return;
    }
    toast({ variant: "destructive", title: "Erreur", description: result?.data?.failure || "Echec d'enregistrement" });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/client-orders">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div className="h-6 w-px bg-border" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouveau bon de commande client</h1>
          <p className="text-muted-foreground">Ajoutez un nouveau bon client avec prix unitaire de reference</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Informations du bon client
            </CardTitle>
            <CardDescription>Renseignez les informations ci-dessous pour enregistrer le bon client.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-muted-foreground">
              <span className="text-destructive">*</span> Champs obligatoires
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Reference <span className="text-destructive">*</span></Label>
                <Input {...register("reference")} className="h-10" />
                {errors.reference ? <p className="text-sm text-destructive">{errors.reference.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label>Date <span className="text-destructive">*</span></Label>
                <Input type="date" {...register("date", { valueAsDate: true })} className="h-10" />
                {errors.date ? <p className="text-sm text-destructive">{errors.date.message as string}</p> : null}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Client <span className="text-destructive">*</span></Label>
              <Controller
                control={control}
                name="clientId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10 [&>span]:truncate"><SelectValue placeholder="Selectionner..." /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="block max-w-[320px] truncate">{c.company || c.name || "Client"}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.clientId ? <p className="text-sm text-destructive">{errors.clientId.message}</p> : null}
            </div>
            <div>
              <Label>Produit <span className="text-destructive">*</span></Label>
              <Controller
                control={control}
                name="produitId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10 [&>span]:truncate"><SelectValue placeholder="Selectionner..." /></SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className="block max-w-[320px] truncate">{p.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.produitId ? <p className="text-sm text-destructive">{errors.produitId.message}</p> : null}
            </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Quantite <span className="text-destructive">*</span></Label>
              <Input type="number" step="0.01" {...register("quantity", { valueAsNumber: true })} className="h-10" />
              {errors.quantity ? <p className="text-sm text-destructive">{errors.quantity.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Prix unitaire <span className="text-destructive">*</span></Label>
              <Input type="number" step="0.0001" {...register("unitPrice", { valueAsNumber: true })} className="h-10" />
              {errors.unitPrice ? <p className="text-sm text-destructive">{errors.unitPrice.message}</p> : null}
            </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label>Devise</Label>
              <Controller
                control={control}
                name="devise"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10 [&>span]:truncate"><SelectValue /></SelectTrigger>
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
                    <SelectTrigger className="h-10 [&>span]:truncate"><SelectValue /></SelectTrigger>
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
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input {...register("notes")} className="h-10" />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 pt-1">
          <Button type="submit" disabled={isSubmitting || status === "executing"} className="flex-1 gap-2">
            <Save className="h-4 w-4" />
            {isSubmitting || status === "executing" ? "Enregistrement..." : "Enregistrer le bon client"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/client-orders")}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
