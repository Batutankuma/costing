"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateBuilder } from "@/app/dashboard/builders/actions";

const Schema = z.object({
  id: z.string(),
  base: z.object({
    plattsFOBUSD: z.number().optional(),
    truckTransportUSD: z.number().optional(),
    agencyCustomsUSD: z.number().optional(),
  }).partial().optional(),
  supplier: z.object({
    storageHospitalityUSD: z.number().optional(),
    anrDechargementUSD: z.number().optional(),
    supplierMarginUSD: z.number().optional(),
  }).partial().optional(),
  customs: z.object({
    customsDutyUSD: z.number().optional(),
    importVATUSD: z.number().optional(),
  }).partial().optional(),
  levies: z.object({
    fonerUSD: z.number().optional(),
    molecularMarkingOrStockUSD: z.number().optional(),
    reconstructionStrategicUSD: z.number().optional(),
    economicInterventionUSD: z.number().optional(),
  }).partial().optional(),
  transport: z.object({
    freightToMineUSD: z.number().optional(),
    lossesLitresPerTruck: z.number().optional(),
  }).partial().optional(),
});

type FormData = z.infer<typeof Schema>;

export default function KalemieEditForm({ item }: { item: any }) {
  const form = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: {
      id: item?.id,
      base: {
        plattsFOBUSD: item?.baseCosts?.plattsFOBUSD ?? undefined,
        truckTransportUSD: item?.baseCosts?.truckTransportUSD ?? undefined,
        agencyCustomsUSD: item?.baseCosts?.agencyCustomsUSD ?? undefined,
      },
      supplier: {
        storageHospitalityUSD: item?.supplierDDU?.storageHospitalityUSD ?? undefined,
        anrDechargementUSD: item?.supplierDDU?.anrDechargementUSD ?? undefined,
        supplierMarginUSD: item?.supplierDDU?.supplierMarginUSD ?? undefined,
      },
      customs: {
        customsDutyUSD: item?.customs?.customsDutyUSD ?? undefined,
        importVATUSD: item?.customs?.importVATUSD ?? undefined,
      },
      levies: {
        fonerUSD: item?.levies?.fonerUSD ?? undefined,
        molecularMarkingOrStockUSD: item?.levies?.molecularMarkingOrStockUSD ?? undefined,
        reconstructionStrategicUSD: item?.levies?.reconstructionStrategicUSD ?? undefined,
        economicInterventionUSD: item?.levies?.economicInterventionUSD ?? undefined,
      },
      transport: {
        freightToMineUSD: item?.transport?.freightToMineUSD ?? undefined,
        lossesLitresPerTruck: item?.transport?.lossesLitresPerTruck ?? undefined,
      },
    },
  });

  const platts = form.watch("base.plattsFOBUSD") || 0;
  const truck = form.watch("base.truckTransportUSD") || 0;
  const agency = form.watch("base.agencyCustomsUSD") || 0;
  const acquisition = Number(platts || 0) + Number(truck || 0) + Number(agency || 0);

  const storage = form.watch("supplier.storageHospitalityUSD") || 0;
  const anr = form.watch("supplier.anrDechargementUSD") || 0;
  const margin = form.watch("supplier.supplierMarginUSD") || 0;
  const freight = form.watch("transport.freightToMineUSD") || 0;
  const losses = form.watch("transport.lossesLitresPerTruck") || 0;
  const ddu = Number(acquisition || 0) + Number(storage || 0) + Number(anr || 0) + Number(margin || 0) + Number(freight || 0) + Number(losses || 0);

  const customsDuty = form.watch("customs.customsDutyUSD") || 0;
  const importVAT = form.watch("customs.importVATUSD") || 0;
  const totalB = Number(customsDuty || 0) + Number(importVAT || 0);

  const foner = form.watch("levies.fonerUSD") || 0;
  const stockMol = form.watch("levies.molecularMarkingOrStockUSD") || 0;
  const recon = form.watch("levies.reconstructionStrategicUSD") || 0;
  const inter = form.watch("levies.economicInterventionUSD") || 0;
  const totalC = Number(foner || 0) + Number(stockMol || 0) + Number(recon || 0) + Number(inter || 0);

  const ddp = Number(ddu || 0) + Number(totalB || 0) + Number(totalC || 0);

  const [transportRates, setTransportRates] = React.useState<Array<{ id: string; destination: string; rateUsdPerCbm: number }>>([]);
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/transport-rates", { cache: "no-store" });
        if (res.ok) setTransportRates(await res.json());
      } catch {}
    })();
  }, []);

  // Conserver l'ID sélectionné pour un affichage correct
  const [selectedTransportRateId, setSelectedTransportRateId] = React.useState<string>("");

  const onSubmit = async (data: FormData) => {
    await updateBuilder(data as any);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader><CardTitle>COÛTS DE BASE DU PRODUIT & TRANSPORT INITIAL</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div><Label>FOB Dar</Label><Input type="number" step="any" {...form.register("base.plattsFOBUSD", { valueAsNumber: true })} /></div>
          <div><Label>Transport camion jusqu'à Kigoma</Label><Input type="number" step="any" {...form.register("base.truckTransportUSD", { valueAsNumber: true })} /></div>
          <div><Label>Expenses Lac Tanganyika</Label><Input type="number" step="any" {...form.register("base.agencyCustomsUSD", { valueAsNumber: true })} /></div>
          <div className="md:col-span-3"><Label>Prix de revient (auto)</Label><Input type="number" value={acquisition} disabled /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>COÛTS & MARGE DU FOURNISSEUR POUR L'OFFRE DDU</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div><Label>Frais stock./hospitality</Label><Input type="number" step="any" {...form.register("supplier.storageHospitalityUSD", { valueAsNumber: true })} /></div>
          <div><Label>ANR-Déchargement-OCC-Hydrocarbures</Label><Input type="number" step="any" {...form.register("supplier.anrDechargementUSD", { valueAsNumber: true })} /></div>
          <div><Label>Marge du Fournisseur</Label><Input type="number" step="any" {...form.register("supplier.supplierMarginUSD", { valueAsNumber: true })} /></div>
          <div className="md:col-span-3"><Label>Prix de vente DDU (auto)</Label><Input type="number" value={ddu} disabled /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>COÛTS COLLECTÉS PAR LA DOUANE (B)</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div><Label>Douane</Label><Input type="number" step="any" {...form.register("customs.customsDutyUSD", { valueAsNumber: true })} /></div>
          <div><Label>TVA import</Label><Input type="number" step="any" {...form.register("customs.importVATUSD", { valueAsNumber: true })} /></div>
          <div><Label>Total B (auto)</Label><Input type="number" value={totalB} disabled /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>C. Total Redevances (Levies)</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div><Label>FONER</Label><Input type="number" step="any" {...form.register("levies.fonerUSD", { valueAsNumber: true })} /></div>
          <div><Label>Stock séc./Moléculaire</Label><Input type="number" step="any" {...form.register("levies.molecularMarkingOrStockUSD", { valueAsNumber: true })} /></div>
          <div><Label>Reconstruction & Stratégique</Label><Input type="number" step="any" {...form.register("levies.reconstructionStrategicUSD", { valueAsNumber: true })} /></div>
          <div><Label>Intervention & Autres</Label><Input type="number" step="any" {...form.register("levies.economicInterventionUSD", { valueAsNumber: true })} /></div>
          <div className="md:col-span-2"><Label>Total C (auto)</Label><Input type="number" value={totalC} disabled /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>COÛTS DE TRANSPORT ADDITIONNELS</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Freight to Mine</Label>
            <Select
              value={selectedTransportRateId}
              onValueChange={(id) => {
                setSelectedTransportRateId(id);
                const rate = transportRates.find((t) => t.id === id)?.rateUsdPerCbm ?? 0;
                form.setValue("transport.freightToMineUSD", Number(rate) as any, { shouldDirty: true });
              }}
            >
              <SelectTrigger>
                <span>
                  {selectedTransportRateId
                    ? (transportRates.find((t) => t.id === selectedTransportRateId)?.destination ?? "Sélectionner un tarif")
                    : "Sélectionner un tarif"}
                </span>
              </SelectTrigger>
              <SelectContent>
                {transportRates.length === 0 ? (
                  <SelectItem value="no-rate" disabled>Aucun tarif</SelectItem>
                ) : (
                  transportRates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.destination} — {t.rateUsdPerCbm} USD/m³
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Pertes (300 L)</Label><Input type="number" step="any" {...form.register("transport.lossesLitresPerTruck", { valueAsNumber: true })} /></div>
          <div className="md:col-span-3"><Label>Total transport (auto)</Label><Input type="number" value={Number(freight || 0) + Number(losses || 0)} disabled /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>PRIX DE VENTE DDP (auto)</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div><Label>DDU (auto)</Label><Input type="number" value={ddu} disabled /></div>
          <div><Label>DDP (auto)</Label><Input type="number" value={ddp} disabled /></div>
        </CardContent>
      </Card>

      <div className="flex justify-end"><Button type="submit">Enregistrer</Button></div>
    </form>
  );
}






