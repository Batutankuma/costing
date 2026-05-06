"use client";

import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { updateHospitality } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Schema = z.object({
  id: z.string(),
  driverName: z.string().min(1),
  supplierId: z.string().min(1),
  transporterId: z.string().min(1),
  truckNo: z.string().min(1),
  trailerNo: z.string().min(1),
  loadingDate: z.string().min(1),
  entryDate: z.string().min(1),
  offlDate: z.string().min(1),
  quantityOrder: z.number().nonnegative(),
  actualQuantity20L: z.number().nonnegative(),
  offlQtyObs: z.number().nonnegative(),
  offlQty20: z.number().nonnegative(),
  depotId: z.string().min(1),
  commandeId: z.string().min(1),
  rate: z.number().nonnegative(),
});

type FormData = z.infer<typeof Schema>;

export default function EditHospitalityForm({
  initial,
  suppliers,
  transporters,
  depots,
  commandes,
}: {
  initial: FormData;
  suppliers: Array<{ id: string; nom: string }>;
  transporters: Array<{ id: string; nom: string }>;
  depots: Array<{ id: string; name: string }>;
  commandes: Array<{ id: string; reference: string; depotId: string | null; quantite: number }>;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<FormData>({ resolver: zodResolver(Schema), defaultValues: initial });

  const quantityOrder = form.watch("quantityOrder") || 0;
  const selectedDepotId = form.watch("depotId");
  const availableCommandes = useMemo(
    () =>
      commandes.filter(
        (commande) =>
          (!selectedDepotId || commande.depotId === selectedDepotId) &&
          (commande.quantite > 0 || commande.id === form.getValues("commandeId"))
      ),
    [commandes, selectedDepotId, form]
  );
  const offlQty20 = form.watch("offlQty20") || 0;
  const selectedCommandeId = form.watch("commandeId");
  const rate = form.watch("rate") || 0;
  const selectedCommande = useMemo(
    () => commandes.find((commande) => commande.id === selectedCommandeId),
    [commandes, selectedCommandeId]
  );
  const remainingQuantity = selectedCommande?.quantite ?? 0;
  const exceedsRemainingQuantity = Boolean(selectedCommande) && offlQty20 > remainingQuantity;
  const variance = useMemo(() => quantityOrder - offlQty20, [quantityOrder, offlQty20]);
  const transit = useMemo(() => quantityOrder * 0.003, [quantityOrder]);
  const disAllowable = useMemo(() => variance - transit, [variance, transit]);
  const total = useMemo(() => disAllowable * rate, [disAllowable, rate]);

  const onSubmit = async (data: FormData) => {
    const result = await updateHospitality({
      ...data,
      loadingDate: new Date(data.loadingDate),
      entryDate: new Date(data.entryDate),
      offlDate: new Date(data.offlDate),
    });
    if (!result?.data?.success) {
      toast({ variant: "destructive", title: "Erreur", description: result?.data?.failure || "Mise a jour impossible." });
      return;
    }
    toast({ title: "Succes", description: "Ligne hospitality mise a jour." });
    router.push("/dashboard/hospitality");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modifier hospitality</CardTitle>
        <CardDescription>Mettre a jour les informations et calculs.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2"><Label>Driver s name</Label><Input {...form.register("driverName")} /></div>
            <div className="space-y-2">
              <Label>SUPPLIER</Label>
              <Controller control={form.control} name="supplierId" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>)}</SelectContent></Select>
              )} />
            </div>
            <div className="space-y-2">
              <Label>TRANSPORTER</Label>
              <Controller control={form.control} name="transporterId" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{transporters.map((t) => <SelectItem key={t.id} value={t.id}>{t.nom}</SelectItem>)}</SelectContent></Select>
              )} />
            </div>
            <div className="space-y-2">
              <Label>Depot</Label>
              <Controller control={form.control} name="depotId" render={({ field }) => (
                <Select value={field.value} onValueChange={(value) => {
                  field.onChange(value);
                  form.setValue("commandeId", "");
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{depots.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-2">
              <Label>Bon de commande</Label>
              <Controller control={form.control} name="commandeId" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableCommandes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.reference} - Reste: {c.quantite}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-2"><Label>Truck No.</Label><Input {...form.register("truckNo")} /></div>
            <div className="space-y-2"><Label>Trailer No.</Label><Input {...form.register("trailerNo")} /></div>
            <div className="space-y-2"><Label>LOADING DATE</Label><Input type="date" {...form.register("loadingDate")} /></div>
            <div className="space-y-2"><Label>ENTRY DATE</Label><Input type="date" {...form.register("entryDate")} /></div>
            <div className="space-y-2"><Label>OFFL DATE</Label><Input type="date" {...form.register("offlDate")} /></div>
            <div className="space-y-2"><Label>Quantity order</Label><Input type="number" step="0.01" {...form.register("quantityOrder", { valueAsNumber: true })} /></div>
            <div className="space-y-2"><Label>Actual quantity @20 (L)</Label><Input type="number" step="0.01" {...form.register("actualQuantity20L", { valueAsNumber: true })} /></div>
            <div className="space-y-2"><Label>OFFL QTY @OBS</Label><Input type="number" step="0.01" {...form.register("offlQtyObs", { valueAsNumber: true })} /></div>
            <div className="space-y-2"><Label>OFFL QTY @20</Label><Input type="number" step="0.01" {...form.register("offlQty20", { valueAsNumber: true })} /></div>
            <div className="space-y-2"><Label>Rate ($)</Label><Input type="number" step="0.01" {...form.register("rate", { valueAsNumber: true })} /></div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 border rounded-lg p-4 bg-muted/20">
            <div><Label>VARIANCE QTY @20</Label><Input value={variance} readOnly /></div>
            <div><Label>Transit Allowable LOSS</Label><Input value={transit} readOnly /></div>
            <div><Label>Dis-Allowable LOSS</Label><Input value={disAllowable} readOnly /></div>
            <div><Label>Total ($)</Label><Input value={total} readOnly /></div>
          </div>
          {selectedCommande ? (
            <p className={exceedsRemainingQuantity ? "text-sm text-destructive font-medium" : "text-sm text-muted-foreground"}>
              Reliquat commande: {remainingQuantity} | OFFL QTY @20 saisi: {offlQty20}
            </p>
          ) : null}

          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" className="flex-1 gap-2" disabled={exceedsRemainingQuantity}>
              <Save className="h-4 w-4" />
              Mettre a jour
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
