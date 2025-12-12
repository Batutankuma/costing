"use client";

import { useMemo, useState } from "react";
import { useForm, useFieldArray, SubmitHandler, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreateKinshasaCostingSchema } from "@/models/mvc.pruned";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createKinshasaCosting, updateKinshasaCosting } from "./actions";
import { Loader2, Plus, Trash2 } from "lucide-react";

type FormSchema = z.infer<typeof CreateKinshasaCostingSchema>;

const DEFAULT_LABELS = [
  "PMF",
  "Logistique",
  "Charges Socom",
  "Parafiscalité",
  "Droit de douane",
  "Droit de consommation",
  "TVA import",
  "TVA intérieur",
];

const makeRow = (label: string) => ({
  label,
  client: 0,
  threshold: 0,
  proposal: 0,
  mag: 0,
  afterMag: 0,
});

interface Props {
  products: Array<{ id: string; name: string }>;
  initialData?: (FormSchema & { id: string }) | null;
}

export default function KinshasaCostingForm({ products, initialData }: Props) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultBreakdown = useMemo(
    () => DEFAULT_LABELS.map(makeRow),
    []
  );

const form = useForm<FormSchema>({
  resolver: zodResolver(CreateKinshasaCostingSchema) as Resolver<FormSchema>,
  defaultValues: (initialData
    ? {
        ...initialData,
        currency: (initialData.currency ?? "CDF") as "USD" | "CDF",
      }
    : {
        title: "",
        description: "",
        productId: "",
        currency: "CDF" as const,
        volumeM3: 0,
        unitPriceUsd: 0,
        clientExchangeRate: 0,
        benchmarkExchangeRate: 0,
        engenPriceCDF: 0,
        engenPriceUSD: 0,
        cdfBreakdown: defaultBreakdown,
        usdBreakdown: defaultBreakdown,
        notes: "",
      }) as FormSchema,
});

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = form;

  const {
    fields: cdfFields,
    append: appendCDF,
    remove: removeCDF,
  } = useFieldArray({
    control,
    name: "cdfBreakdown",
  });

  const {
    fields: usdFields,
    append: appendUSD,
    remove: removeUSD,
  } = useFieldArray({
    control,
    name: "usdBreakdown",
  });

  const onSubmit: SubmitHandler<FormSchema> = async (values) => {
    setIsSubmitting(true);
    try {
      if (initialData?.id) {
        const result = await updateKinshasaCosting({ ...values, id: initialData.id });
        if (result?.data?.failure) {
          toast({ variant: "destructive", title: "Erreur", description: result.data.failure });
          return;
        }
        toast({ title: "Costing mis à jour" });
        router.push(`/dashboard/kinshasa-costings/views/${initialData.id}`);
        return;
      }

      const result = await createKinshasaCosting(values);
      if (result?.data?.failure) {
        toast({ variant: "destructive", title: "Erreur", description: result.data.failure });
        return;
      }
      toast({ title: "Costing créé" });
      router.push("/dashboard/kinshasa-costings");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'enregistrer le costing.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const numericKeys = ["client", "threshold", "proposal", "mag", "afterMag"] as const;

  const renderBreakdown = (
    type: "cdfBreakdown" | "usdBreakdown",
    fields: typeof cdfFields,
    append: (value: ReturnType<typeof makeRow>) => void,
    remove: (index: number) => void
  ) => {
    const breakdownErrors = type === "cdfBreakdown" ? errors.cdfBreakdown : errors.usdBreakdown;
    return (
      <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">
          {type === "cdfBreakdown" ? "Structure en CDF" : "Structure en USD"}
        </h3>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={() => append(makeRow("Nouvelle ligne"))}
        >
          <Plus size={14} />
          Ajouter une ligne
        </Button>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left">Libellé</th>
              <th className="p-3 text-right">Client</th>
              <th className="p-3 text-right">Seuil rentab.</th>
              <th className="p-3 text-right">Prix proposé</th>
              <th className="p-3 text-right">MAG</th>
              <th className="p-3 text-right">Prix après MAG</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr key={field.id} className="border-t">
                <td className="p-3">
                  <Input {...register(`${type}.${index}.label` as const)} />
                  {breakdownErrors?.[index]?.label && (
                    <p className="text-xs text-destructive mt-1">
                      {breakdownErrors?.[index]?.label?.message as string}
                    </p>
                  )}
                </td>
                {numericKeys.map((key) => (
                  <td className="p-2" key={key}>
                    <Input
                      type="number"
                      step="0.01"
                      className="text-right"
                      {...register(`${type}.${index}.${key}` as const, { valueAsNumber: true })}
                    />
                  </td>
                ))}
                <td className="p-2 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    aria-label="Supprimer la ligne"
                  >
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Titre</Label>
              <Input {...register("title")} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div>
              <Label>Produit associé</Label>
              <Select
                value={watch("productId") ?? ""}
                onValueChange={(value) => form.setValue("productId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.productId && (
                <p className="text-sm text-destructive">{errors.productId.message}</p>
              )}
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={3} {...register("description")} />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label>Devise</Label>
              <Select
                value={watch("currency")}
                onValueChange={(value) => form.setValue("currency", value as "USD" | "CDF")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CDF">CDF</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Volume (m³)</Label>
              <Input type="number" step="0.01" {...register("volumeM3", { valueAsNumber: true })} />
            </div>
            <div>
              <Label>Prix unitaire (USD)</Label>
              <Input type="number" step="0.01" {...register("unitPriceUsd", { valueAsNumber: true })} />
            </div>
            <div>
              <Label>Prix ENGEN (CDF)</Label>
              <Input type="number" step="0.01" {...register("engenPriceCDF", { valueAsNumber: true })} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label>Prix ENGEN (USD)</Label>
              <Input type="number" step="0.01" {...register("engenPriceUSD", { valueAsNumber: true })} />
            </div>
            <div>
              <Label>Taux client</Label>
              <Input type="number" step="0.01" {...register("clientExchangeRate", { valueAsNumber: true })} />
            </div>
            <div>
              <Label>Taux de référence</Label>
              <Input type="number" step="0.01" {...register("benchmarkExchangeRate", { valueAsNumber: true })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Input {...register("notes")} placeholder="Optionnel" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Détails coût en CDF</CardTitle>
        </CardHeader>
        <CardContent>{renderBreakdown("cdfBreakdown", cdfFields, appendCDF, removeCDF)}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Détails coût en USD</CardTitle>
        </CardHeader>
        <CardContent>{renderBreakdown("usdBreakdown", usdFields, appendUSD, removeUSD)}</CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {initialData?.id ? "Mettre à jour" : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

