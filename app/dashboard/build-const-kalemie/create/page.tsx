"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import * as React from "react";
import { createBuilder } from "../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Schéma minimal pour saisir les valeurs de votre capture (USD/M3)
const Schema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  unit: z.literal("USD_M3").default("USD_M3"),
  base: z.object({
    plattsFOBUSD: z.number().min(0).default(635),
    truckTransportUSD: z.number().min(0).default(95),
    brutCFUSD: z.number().min(0).default(0),
    agencyCustomsUSD: z.number().min(0).default(0),
    acquisitionCostUSD: z.number().min(0).default(0),
  }).partial(),
  supplier: z.object({
    storageHospitalityUSD: z.number().min(0).default(13),
    anrDechargementUSD: z.number().min(0).default(3),
    supplierMarginUSD: z.number().min(0).default(100),
    sellingPriceDDUUSD: z.number().min(0).default(0),
  }).partial(),
  customs: z.object({
    customsDutyUSD: z.number().min(0).default(0),
    importVATUSD: z.number().min(0).default(0),
    subtotalUSD: z.number().min(0).default(0),
  }).partial(),
  levies: z.object({
    fonerUSD: z.number().min(0).default(0),
    molecularMarkingOrStockUSD: z.number().min(0).default(0),
    reconstructionStrategicUSD: z.number().min(0).default(0),
    economicInterventionUSD: z.number().min(0).default(0),
    totalLeviesUSD: z.number().min(0).default(0),
  }).partial(),
  transport: z.object({
    freightToMineUSD: z.number().min(0).default(0),
    lossesLitresPerTruck: z.number().min(0).default(7.3),
    totalTransportFinalUSD: z.number().min(0).default(0),
  }).partial(),
  totals: z.object({
    priceDDUUSD: z.number().min(0).default(1006.8),
    priceDDPUSD: z.number().min(0).default(1659.5),
  }).partial(),
});

type FormData = z.infer<typeof Schema>;

export default function CreateKalemieBuildConstPage() {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const form = useForm({
    resolver: zodResolver(Schema),
    defaultValues: {
      title: "Kalemie - Minier",
      unit: "USD_M3",
    },
  });

  const watchPlatts = form.watch("base.plattsFOBUSD") || 0;
  const watchTruck = form.watch("base.truckTransportUSD") || 0;
  const watchAgency = form.watch("base.agencyCustomsUSD") || 0;
  const brutCF = Number(watchPlatts) + Number(watchTruck);
  const acquisition = brutCF + Number(watchAgency);

  const watchStorage = form.watch("supplier.storageHospitalityUSD") || 0;
  const watchAnr = form.watch("supplier.anrDechargementUSD") || 0;
  const watchMargin = form.watch("supplier.supplierMarginUSD") || 0;
  const ddu = acquisition + Number(watchStorage) + Number(watchAnr) + Number(watchMargin);

  const watchCustomsDuty = form.watch("customs.customsDutyUSD") || 0;
  const watchImportVAT = form.watch("customs.importVATUSD") || 0;
  const customsSubtotal = Number(watchCustomsDuty) + Number(watchImportVAT);

  const watchLosses = form.watch("transport.lossesLitresPerTruck") || 0;
  const transportTotal = Number(form.watch("transport.freightToMineUSD") || 0) + Number(watchLosses || 0);

  // Levies total (C)
  const watchFoner = form.watch("levies.fonerUSD") || 0;
  const watchStockMol = form.watch("levies.molecularMarkingOrStockUSD") || 0;
  const watchReconstruction = form.watch("levies.reconstructionStrategicUSD") || 0;
  const watchIntervention = form.watch("levies.economicInterventionUSD") || 0;
  const watchLeviesTotal = Number(watchFoner || 0) + Number(watchStockMol || 0) + Number(watchReconstruction || 0) + Number(watchIntervention || 0);

  // DDU inclut les pertes (1%) avant marge dans votre tableau. On les ajoute ici.
  const dduWithLosses = ddu + Number(transportTotal || 0);
  const ddp = dduWithLosses + customsSubtotal + Number(watchLeviesTotal || 0);

  // Répercuter les calculs dans le form state (comme les autres builders)
  React.useEffect(() => {
    form.setValue("userId", (session?.user as any)?.id ?? "temp-user-id", { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [session?.user?.id]);

  React.useEffect(() => {
    form.setValue("base.brutCFUSD", brutCF as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [brutCF]);

  React.useEffect(() => {
    form.setValue("base.acquisitionCostUSD", acquisition as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [acquisition]);

  React.useEffect(() => {
    form.setValue("supplier.sellingPriceDDUUSD", dduWithLosses as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [dduWithLosses]);

  React.useEffect(() => {
    form.setValue("customs.subtotalUSD", customsSubtotal as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [customsSubtotal]);

  React.useEffect(() => {
    form.setValue("transport.totalTransportFinalUSD", transportTotal as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [transportTotal]);

  React.useEffect(() => {
    form.setValue("levies.totalLeviesUSD", watchLeviesTotal as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [watchLeviesTotal]);

  React.useEffect(() => {
    form.setValue("totals.priceDDUUSD", dduWithLosses as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
    form.setValue("totals.priceDDPUSD", ddp as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [dduWithLosses, ddp]);

  // Charger les tarifs de transport (Freight to Mine) depuis l'API
  const [transportRates, setTransportRates] = React.useState<Array<{ id: string; destination: string; rateUsdPerCbm: number }>>([]);
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/transport-rates", { cache: "no-store" });
        if (res.ok) {
          const list = await res.json();
          setTransportRates(Array.isArray(list) ? list : []);
        }
      } catch {
        setTransportRates([]);
      }
    })();
  }, []);

  // Gestion de la sélection visuelle du tarif (par ID) pour afficher l'élément choisi
  const [selectedTransportRateId, setSelectedTransportRateId] = React.useState<string>("");

  const onSubmit = async (data: FormData) => {
    // Data validée via zodResolver
    await createBuilder({
      ...data,
      title: `${data.title || "Kalemie - Minier"} #kalemie`,
    } as any);
    router.push("/dashboard/build-const-kalemie");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Nouveau Build-Const Kalemie</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <input type="hidden" {...form.register("userId")} />
        <Card>
          <CardHeader>
            <CardTitle>COÛTS DE BASE DU PRODUIT & TRANSPORT INITIAL</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Titre</Label><Input {...form.register("title")} /></div>
            <div><Label>FOB Dar</Label><Input type="number" step="any" {...form.register("base.plattsFOBUSD", { valueAsNumber: true })} /></div>
            <div><Label>Transport camion jusqu'à Kigoma</Label><Input type="number" step="any" {...form.register("base.truckTransportUSD", { valueAsNumber: true })} /></div>
            <div><Label>Expenses Lac Tanganyika</Label><Input type="number" step="any" {...form.register("base.agencyCustomsUSD", { valueAsNumber: true })} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>A. Prix de revient (Coût d'acquisition sans premiers frais)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Brut C&F (auto)</Label><Input type="number" disabled value={Number.isFinite(brutCF) ? brutCF : 0} /></div>
            <div><Label>Prix de revient (auto)</Label><Input type="number" disabled value={Number.isFinite(acquisition) ? acquisition : 0} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>COÛTS & MARGE DU FOURNISSEUR POUR L'OFFRE DDU</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Frais stock./hospitality</Label><Input type="number" step="any" {...form.register("supplier.storageHospitalityUSD", { valueAsNumber: true })} /></div>
            <div><Label>ANR-Déchargement-OCC-Hydrocarbures</Label><Input type="number" step="any" {...form.register("supplier.anrDechargementUSD", { valueAsNumber: true })} /></div>
            <div><Label>Marge du Fournisseur</Label><Input type="number" step="any" {...form.register("supplier.supplierMarginUSD", { valueAsNumber: true })} /></div>
            <div>
              <div className="flex items-center gap-2">
                <Label>Prix de vente DDU (auto)</Label>
              </div>
              <Input type="number" disabled value={Number.isFinite(dduWithLosses) ? dduWithLosses : 0} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>COÛTS COLLECTÉS PAR LA DOUANE (B)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Douane</Label><Input type="number" step="any" {...form.register("customs.customsDutyUSD", { valueAsNumber: true })} /></div>
            <div><Label>TVA import</Label><Input type="number" step="any" {...form.register("customs.importVATUSD", { valueAsNumber: true })} /></div>
            <div><Label>Total B (auto)</Label><Input type="number" disabled value={Number.isFinite(customsSubtotal) ? customsSubtotal : 0} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>C. Total Redevances (Levies)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Levies - ROAD FUND (FONER)</Label><Input type="number" step="any" {...form.register("levies.fonerUSD", { valueAsNumber: true })} /></div>
            <div><Label>Levies - Stock de séc. SUD 2 / Marquage moléculaire</Label><Input type="number" step="any" {...form.register("levies.molecularMarkingOrStockUSD", { valueAsNumber: true })} /></div>
            <div><Label>Levies - Effort de reconstruction & Stock Stratégique</Label><Input type="number" step="any" {...form.register("levies.reconstructionStrategicUSD", { valueAsNumber: true })} /></div>
            <div><Label>Levies - Intervention Economique & Autres</Label><Input type="number" step="any" {...form.register("levies.economicInterventionUSD", { valueAsNumber: true })} /></div>
            <div><Label>Total C (auto)</Label><Input type="number" disabled value={Number.isFinite(watchLeviesTotal) ? watchLeviesTotal : 0} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>COÛTS DE TRANSPORT ADDITIONNELS</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div><Label>Pertes (300 litres/camion)</Label><Input type="number" step="any" {...form.register("transport.lossesLitresPerTruck", { valueAsNumber: true })} /></div>
            <div><Label>Total Frais de transport finaux (auto)</Label><Input type="number" disabled value={Number.isFinite(transportTotal) ? transportTotal : 0} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PRIX DE VENTE DDP (auto)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>DDP (auto)</Label><Input type="number" disabled value={Number.isFinite(ddp) ? ddp : 0} /></div>
          </CardContent>
        </Card>

        <Separator />
        <div className="flex justify-end"><Button type="submit">Enregistrer</Button></div>
      </form>
    </div>
  );
}


