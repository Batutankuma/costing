"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction } from "next-safe-action/hooks";
import { CreateDeliverySchema } from "@/models/mvc";
import { createAction } from "../../delivery/actions";
import { getClients } from "@/app/dashboard/clients/actions";
import { listDepots } from "@/app/dashboard/depots/actions";
import { findAllAction as findAllEquipment } from "@/app/dashboard/equipment/actions";
import { getTransporteurs } from "@/app/dashboard/transport/actions";
import { listClientOrdersAction } from "@/app/dashboard/client-orders/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type ClientRef = { id: string; nom?: string; name?: string; company?: string };
type DepotRef = { id: string; name?: string };
type EquipmentRef = { id: string; name?: string; depotId?: string | null };
type TransporteurRef = { id: string; nom: string };
type ClientOrderRef = {
  id: string;
  reference: string;
  clientId: string;
  produitId: string;
  unitPrice: number;
  client?: { id: string; name?: string | null; company?: string | null } | null;
  produit?: { id: string; name?: string } | null;
};

export default function DeliveryLBBCreatePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientRef[]>([]);
  const [depots, setDepots] = useState<DepotRef[]>([]);
  const [equipment, setEquipment] = useState<EquipmentRef[]>([]);
  const [transporteurs, setTransporteurs] = useState<TransporteurRef[]>([]);
  const [clientOrders, setClientOrders] = useState<ClientOrderRef[]>([]);

  const { executeAsync: executeCreate, isExecuting } = useAction(createAction);
  const { executeAsync: executeDepots } = useAction(listDepots);
  const { executeAsync: executeEquipment } = useAction(findAllEquipment);
  const { executeAsync: executeClientOrders } = useAction(listClientOrdersAction);

  const {
    control,
    handleSubmit,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(CreateDeliverySchema),
    defaultValues: {
      commandNumber: "",
      clientId: "",
      truckTrailerNo: "",
      driverName: "",
      transporterId: "",
      truckCapacity: null,
      destinationClientId: "",
      qLoaded: 0,
      temperature: null,
      density: null,
      q20: 0,
      loadingDate: new Date(),
      qOffloaded: 0,
      dateOffloaded: new Date(),
      depotId: "",
      prixUnitaire: null,
      departureDate: null,
      etaDate: null,
      ataDate: null,
      eod: "",
      remarks: "",
      rate: 0,
      quantity: 0,
      unit: "L",
      deliveryDate: new Date(),
      paiement: "DIRECT",
      varianceQty20: 0,
      transitAllowableLoss: 0,
      disAllowableLoss: 0,
      total: 0,
    },
  });

  const depotId = watch("depotId");
  const q20 = Number(watch("q20") ?? 0);
  const qOffloaded = Number(watch("qOffloaded") ?? 0);
  const rate = Number(watch("rate") ?? 0);
  const varianceQty20 = q20 - qOffloaded;
  const transitAllowableLoss = q20 * 0.003;
  const disAllowableLoss = varianceQty20 - transitAllowableLoss;
  const total = disAllowableLoss * rate;

  useEffect(() => {
    setValue("varianceQty20", varianceQty20, { shouldValidate: false });
    setValue("transitAllowableLoss", transitAllowableLoss, { shouldValidate: false });
    setValue("disAllowableLoss", disAllowableLoss, { shouldValidate: false });
    setValue("total", total, { shouldValidate: false });
    setValue("quantity", qOffloaded, { shouldValidate: false });
  }, [disAllowableLoss, qOffloaded, q20, rate, setValue, total, transitAllowableLoss, varianceQty20]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [clientsResult, depotsResult, equipmentResult, transporteurResult, clientOrdersResult] = await Promise.all([
          getClients(),
          executeDepots(),
          executeEquipment(),
          getTransporteurs(),
          executeClientOrders(),
        ]);
        if (!mounted) return;
        setClients((clientsResult ?? []) as ClientRef[]);

        const allDepots = (depotsResult?.data?.data ?? []) as DepotRef[];
        const sortedDepots = [...allDepots].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "fr"));
        setDepots(sortedDepots);
        if (sortedDepots[0]?.id) {
          setValue("depotId", sortedDepots[0].id);
        }

        const eq = ((equipmentResult?.data?.success ? equipmentResult.data.result : []) ?? []) as EquipmentRef[];
        setEquipment(eq);
        setTransporteurs((transporteurResult ?? []) as TransporteurRef[]);
        setClientOrders(((clientOrdersResult?.data?.success as ClientOrderRef[]) ?? []) as ClientOrderRef[]);
      } catch {
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données" });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
    // Les callbacks useAction peuvent changer de référence et relancer la page en boucle.
    // On charge les données une seule fois au montage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredEquipment = useMemo(
    () => (depotId ? equipment.filter((e) => e.depotId === depotId) : equipment),
    [depotId, equipment]
  );
  const applyClientOrder = (orderId: string) => {
    const order = clientOrders.find((item) => item.id === orderId);
    if (!order) return;
    setValue("commandNumber", order.reference);
    setValue("clientId", order.clientId);
    setValue("prixUnitaire", Number(order.unitPrice || 0));
    setValue("produitId", order.produitId);
  };

  const onSubmit = async (data: unknown) => {
    const result = await (executeCreate as (payload: unknown) => Promise<{ data?: { success?: boolean; failure?: string } }>)(data);
    if (result?.data?.success) {
      toast({ title: "Succès", description: "DeliveryLBB enregistrée." });
      router.push("/dashboard/delivery-lbb");
      return;
    }
    toast({ variant: "destructive", title: "Erreur", description: result?.data?.failure || "Échec d'enregistrement" });
  };

  if (loading) return <div className="p-6">Chargement...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Nouveau DeliveryLBB</h1>
        <Button variant="outline" onClick={() => router.push("/dashboard/delivery-lbb")}>Retour</Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Données principales</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Bon de commande client</Label>
              <Select onValueChange={applyClientOrder}>
                <SelectTrigger><SelectValue placeholder="Selectionner..." /></SelectTrigger>
                <SelectContent>
                  {clientOrders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.reference} - {(order.client?.company || order.client?.name || "Client")} - {(order.produit?.name || "Produit")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Num Commande</Label>
              <Input {...register("commandNumber")} />
            </div>
            <div>
              <Label>Client</Label>
              <Select onValueChange={(v) => setValue("clientId", v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.nom || c.name || c.company || "Sans nom"}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Destination (Client)</Label>
              <Select onValueChange={(v) => setValue("destinationClientId", v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner destination" /></SelectTrigger>
                <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.nom || c.name || c.company || "Sans nom"}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div><Label>Truck & Trailer No</Label><Input {...register("truckTrailerNo")} /></div>
            <div><Label>Driver Name</Label><Input {...register("driverName")} /></div>
            <div>
              <Label>Transporter</Label>
              <Select onValueChange={(v) => setValue("transporterId", v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner transporteur" /></SelectTrigger>
                <SelectContent>{transporteurs.map((t) => <SelectItem key={t.id} value={t.id}>{t.nom}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div><Label>Truck Capacity</Label><Input type="number" step="0.01" {...register("truckCapacity", { valueAsNumber: true })} /></div>
            <div><Label>Q Loaded</Label><Input type="number" step="0.01" {...register("qLoaded", { valueAsNumber: true })} /></div>
            <div><Label>Temp</Label><Input type="number" step="0.01" {...register("temperature", { valueAsNumber: true })} /></div>
            <div><Label>Dens</Label><Input type="number" step="0.0001" {...register("density", { valueAsNumber: true })} /></div>
            <div><Label>Q @20</Label><Input type="number" step="0.01" {...register("q20", { valueAsNumber: true })} /></div>
            <div><Label>Q Offloaded</Label><Input type="number" step="0.01" {...register("qOffloaded", { valueAsNumber: true })} /></div>

            <div><Label>Date of Loading</Label><Input type="date" {...register("loadingDate", { valueAsDate: true })} /></div>
            <div><Label>Date Offloaded</Label><Input type="date" {...register("dateOffloaded", { valueAsDate: true })} /></div>
            <div>
              <Label>Loading Depot</Label>
              <Controller
                control={control}
                name="depotId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? undefined}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setValue("equipmentId", "");
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Selectionner..." /></SelectTrigger>
                    <SelectContent>
                      {depots.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name || "Dépôt"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div><Label>Departure Date</Label><Input type="date" {...register("departureDate", { valueAsDate: true })} /></div>
            <div><Label>ETA</Label><Input type="date" {...register("etaDate", { valueAsDate: true })} /></div>
            <div><Label>ATA</Label><Input type="date" {...register("ataDate", { valueAsDate: true })} /></div>
            <div><Label>EOD</Label><Input {...register("eod")} /></div>
            <div><Label>Remarks</Label><Input {...register("remarks")} /></div>
            <div><Label>Rate ($)</Label><Input type="number" step="0.0001" {...register("rate", { valueAsNumber: true })} /></div>
            <div><Label>Prix de vente unitaire ($)</Label><Input type="number" step="0.0001" {...register("prixUnitaire", { valueAsNumber: true })} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Calculs automatiques</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><Label>VARIANCE QTY @20</Label><Input value={varianceQty20.toFixed(3)} readOnly className="bg-muted" /></div>
            <div><Label>Transit Allowable LOSS</Label><Input value={transitAllowableLoss.toFixed(3)} readOnly className="bg-muted" /></div>
            <div><Label>Dis-Allowable LOSS</Label><Input value={disAllowableLoss.toFixed(3)} readOnly className="bg-muted" /></div>
            <div><Label>Total ($)</Label><Input value={total.toFixed(2)} readOnly className="bg-muted" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Lien stock</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Equipment (optionnel)</Label>
              <Select onValueChange={(v) => setValue("equipmentId", v)}>
                <SelectTrigger><SelectValue placeholder="Sélectionner équipement" /></SelectTrigger>
                <SelectContent>{filteredEquipment.map((e) => <SelectItem key={e.id} value={e.id}>{e.name || "Sans nom"}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date de livraison (système)</Label>
              <Input type="date" {...register("deliveryDate", { valueAsDate: true })} />
            </div>
          </CardContent>
        </Card>

        {errors.quantity ? <p className="text-sm text-red-500">{errors.quantity.message as string}</p> : null}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/delivery-lbb")}>Annuler</Button>
          <Button type="submit" disabled={isExecuting}>{isExecuting ? "Enregistrement..." : "Créer"}</Button>
        </div>
      </form>
    </div>
  );
}

