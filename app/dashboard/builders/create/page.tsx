"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreateCostBuildUpSchema } from "@/models/mvc.pruned";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAction } from "next-safe-action/hooks";
import { createBuilder } from "../actions";
import { listPriceReferences } from "@/app/dashboard/prices/actions";
import { useAction as useSafeAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FormData = z.infer<typeof CreateCostBuildUpSchema>;

export default function CreateBuilderPage() {
  const router = useRouter();
  const { executeAsync, status } = useAction(createBuilder);
  const isPending = status === "executing";
  const { data: session } = authClient.useSession();
  const { executeAsync: loadRefs } = useSafeAction(listPriceReferences);
  type PriceReference = {
    id: string;
    nomStructure?: string | null;
    date?: string | Date | null;
    exchangeRate?: { rate?: number | null } | null;
    fiscality?: { customsDuty?: number | null; importVAT?: number | null } | null;
    parafiscality?: { foner?: number | null; stockSecurity1?: number | null; stockSecurity2?: number | null; molecularMarking?: number | null; reconstructionEffort?: number | null; intervention?: number | null } | null;
  };
  const [refs, setRefs] = React.useState<PriceReference[]>([]);
  const [selectedRefId, setSelectedRefId] = React.useState<string>("");
  const [transportRates, setTransportRates] = React.useState<Array<{ id: string; destination: string; rateUsdPerCbm: number }>>([]);
  const [selectedTransportRateId, setSelectedTransportRateId] = React.useState<string>("");

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(CreateCostBuildUpSchema),
    defaultValues: {
      title: "",
      unit: "USD_M3" as "USD_M3" | "USD_LITRE",
      userId: "",
    },
  });

  // Options: local price and transport rates
  const [useLocalPrice, setUseLocalPrice] = React.useState(false);
  const [localAcquisitionCostUSD, setLocalAcquisitionCostUSD] = React.useState<number>(0);

  React.useEffect(() => {
    if (session?.user?.id) {
      setValue("userId", session.user.id, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
    }
  }, [session?.user?.id, setValue]);

  React.useEffect(() => {
    (async () => {
      const res = await loadRefs();
      const items = res?.data?.result ?? [];
      setRefs(items);
    })();
  }, [loadRefs]);

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

  const round1 = React.useCallback((n: number | null | undefined) => {
    const v = Number(n ?? 0);
    return Number.isFinite(v) ? Math.round(v * 10) / 10 : 0;
  }, []);

  const applyFromPriceRef = React.useCallback((refItem: PriceReference | null | undefined) => {
    if (!refItem) return;
    const rate = refItem?.exchangeRate?.rate ?? 0;
    const toUSD = (v?: number | null) => (typeof v === "number" && rate > 0 ? v / rate : undefined);
    // Customs from fiscality
    const cd = round1(toUSD(refItem?.fiscality?.customsDuty ?? undefined));
    const iv = round1(toUSD(refItem?.fiscality?.importVAT ?? undefined));
    const subtotal = round1((cd ?? 0) + (iv ?? 0));
    setValue("customs.customsDutyUSD", cd);
    setValue("customs.importVATUSD", iv);
    setValue("customs.subtotalUSD", subtotal);
    // Levies from parafiscality
    const pf = refItem?.parafiscality ?? {};
    setValue("levies.fonerUSD", round1(toUSD(pf.foner)));
    const combinedCDF = Number(pf.stockSecurity1 ?? 0) + Number(pf.stockSecurity2 ?? 0) + Number(pf.molecularMarking ?? 0);
    const combinedUSD = round1(toUSD(combinedCDF) ?? 0);
    setValue("levies.molecularMarkingOrStockUSD", combinedUSD);
    setValue("levies.reconstructionStrategicUSD", round1(toUSD(pf.reconstructionEffort)));
    setValue("levies.economicInterventionUSD", round1(toUSD(pf.intervention)));
    const totalLevies = round1((round1(toUSD(pf.foner)) ?? 0) + combinedUSD + (round1(toUSD(pf.reconstructionEffort)) ?? 0) + (round1(toUSD(pf.intervention)) ?? 0));
    setValue("levies.totalLeviesUSD", totalLevies);
    // Totals convenience
    setValue("totals.totalCustomsUSD", subtotal);
  }, [round1, setValue]);

  // Auto: Brut C&F = Platt's/FOB + Transport (camion)
  const plattsFOB = watch("base.plattsFOBUSD") || 0;
  const truckTrans = watch("base.truckTransportUSD") || 0;
  const agencyCustoms = watch("base.agencyCustomsUSD") || 0;
  const brutCF = useLocalPrice ? 0 : (Number(plattsFOB || 0) + Number(truckTrans || 0));
  React.useEffect(() => {
    setValue("base.brutCFUSD", brutCF, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [brutCF, setValue]);

  // Auto: Prix de revient = Platt's/FOB + Transport (camion) + Agency/Customs
  const acquisitionCost = useLocalPrice ? Number(localAcquisitionCostUSD || 0) : (Number(plattsFOB || 0) + Number(truckTrans || 0) + Number(agencyCustoms || 0));
  React.useEffect(() => {
    setValue("base.acquisitionCostUSD", acquisitionCost, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [acquisitionCost, setValue]);

  // Auto: Prix DDU = Prix de revient + Stockage/Hospitalité + ANR-Déchargement + Marge fournisseur + Frais escorte + Intérêts banque
  const storageHosp = watch("supplier.storageHospitalityUSD") || 0;
  const anr = watch("supplier.anrDechargementUSD") || 0;
  const marginSupp = watch("supplier.supplierMarginUSD") || 0;
  const escortFees = watch("supplier.escortFeesUSD") || 0;
  const bankInterest = watch("supplier.bankInterestUSD") || 0;
  const priceDDU = Number(acquisitionCost || 0) + Number(storageHosp || 0) + Number(anr || 0) + Number(marginSupp || 0) + Number(escortFees || 0) + Number(bankInterest || 0);
  React.useEffect(() => {
    setValue("supplier.sellingPriceDDUUSD", priceDDU, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [priceDDU, setValue]);

  // Customs total (auto)
  const customsDutyUSD = watch("customs.customsDutyUSD") || 0;
  const importVATUSD = watch("customs.importVATUSD") || 0;
  const totalCustomsUSD = Number(customsDutyUSD || 0) + Number(importVATUSD || 0);
  const totalCustomsUSDRounded = round1(totalCustomsUSD);
  React.useEffect(() => {
    setValue("customs.subtotalUSD", totalCustomsUSDRounded, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
    setValue("totals.totalCustomsUSD", totalCustomsUSDRounded, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [totalCustomsUSDRounded, setValue]);

  // Levies total (auto)
  const fonerUSD = watch("levies.fonerUSD") || 0;
  const molecularOrStockUSD = watch("levies.molecularMarkingOrStockUSD") || 0;
  const reconstructionUSD = watch("levies.reconstructionStrategicUSD") || 0;
  const interventionUSD = watch("levies.economicInterventionUSD") || 0;
  const totalLeviesUSD = [fonerUSD, molecularOrStockUSD, reconstructionUSD, interventionUSD]
    .map((n) => Number(n || 0)).reduce((a, b) => a + b, 0);
  const totalLeviesUSDRounded = round1(totalLeviesUSD);
  React.useEffect(() => {
    setValue("levies.totalLeviesUSD", totalLeviesUSDRounded, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
    setValue("totals.totalLeviesUSD", totalLeviesUSDRounded, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [totalLeviesUSDRounded, setValue]);

  // Transport final total (auto)
  const freightToMineUSD = watch("transport.freightToMineUSD") || 0;
  const lossesLitresPerTruck = watch("transport.lossesLitresPerTruck") || 0;
  const totalTransportFinalUSD = Number(freightToMineUSD || 0) + Number(lossesLitresPerTruck || 0);
  const totalTransportFinalUSDRounded = round1(totalTransportFinalUSD);
  React.useEffect(() => {
    setValue("transport.totalTransportFinalUSD", totalTransportFinalUSDRounded, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [totalTransportFinalUSDRounded, setValue]);

  // Price DDP (auto) = DDU + Douanes + Redevances + Transport final
  const priceDDPRaw = Number(priceDDU || 0) + Number(totalCustomsUSDRounded || 0) + Number(totalLeviesUSDRounded || 0) + Number(totalTransportFinalUSDRounded || 0);
  const priceDDP = round1(priceDDPRaw);
  React.useEffect(() => {
    setValue("totals.priceDDUUSD", round1(priceDDU), { shouldDirty: false, shouldTouch: false, shouldValidate: false });
    setValue("totals.priceDDPUSD", priceDDP, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [priceDDU, priceDDP, round1, setValue]);

  const onSubmit = async (data: FormData) => {
    const res = await executeAsync(data);
    if (res?.data?.success) {
      router.push("/dashboard/builders");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 pb-24">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nouveau Builder</h1>
            <p className="text-muted-foreground">Créer une nouvelle structure de coûts</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Annuler
          </Button>
        </div>
      </div>

      <form id="builder-create-form" onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
        <div className="grid md:grid-cols-2 gap-2">
          <div>
            <Label>Titre</Label>
            <Input {...register("title")} />
            {errors.title && <p className="text-red-500 text-sm">{String(errors.title.message)}</p>}
          </div>
          <div>
            <Label>Unité</Label>
            <select className="h-9 w-full rounded-md border border-border bg-background px-3" defaultValue="USD_M3" {...register("unit")}>
              <option value="USD_M3">USD / M3</option>
              <option value="USD_LITRE">USD / Litre</option>
            </select>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Structure officielle (PriceReference) - Minier</Label>
            <select
              className="h-9 w-full rounded-md border border-border bg-background px-3"
              value={selectedRefId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedRefId(id);
                setValue("priceReferenceId", id);
                const found = refs.find((r) => r.id === id);
                applyFromPriceRef(found);
              }}
            >
              <option value="">— Sélectionner structure minier —</option>
              {refs.map((r) => {
                const displayDate = r.date ? new Date(r.date).toLocaleDateString() : "";
                return (
                  <option key={r.id} value={r.id}>
                    {r.nomStructure} — {displayDate}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
        <input type="hidden" {...register("userId")} />
        <input type="hidden" {...register("priceReferenceId")} />

        <Label className="text-lg font-semibold text-orange-400">Coûts de base du produit & transport initial</Label>
        <div className="grid md:grid-cols-5 gap-4">
          <div className="col-span-5 flex items-center gap-2">
            <input id="useLocalPrice" type="checkbox" checked={useLocalPrice} onChange={(e) => setUseLocalPrice(e.target.checked)} />
            <Label htmlFor="useLocalPrice">Saisir directement le prix de revient (local)</Label>
          </div>
          {useLocalPrice && (
            <div className="col-span-5"><Label>Prix de revient (USD)</Label><Input type="number" step="0.01" value={localAcquisitionCostUSD} onChange={(e) => setLocalAcquisitionCostUSD(Number(e.target.value || 0))} /></div>
          )}
          <div><Label>Platt&apos;s/FOB</Label><Input type="number" step="0.01" {...register("base.plattsFOBUSD", { valueAsNumber: true })} disabled={useLocalPrice} /></div>
          <div><Label>Transport (camion)</Label><Input type="number" step="0.01" {...register("base.truckTransportUSD", { valueAsNumber: true })} disabled={useLocalPrice} /></div>
          <div><Label>Brut C&F (auto)</Label><Input type="number" step="0.01" value={Number.isFinite(brutCF) ? brutCF : 0} disabled /></div>
          <div><Label>Agency/Customs</Label><Input type="number" step="0.01" {...register("base.agencyCustomsUSD", { valueAsNumber: true })} disabled={useLocalPrice} /></div>
          <div><Label>Prix de revient (auto)</Label><Input type="number" step="0.01" value={Number.isFinite(acquisitionCost) ? acquisitionCost : 0} disabled /></div>
        </div>

        <Label className="text-lg font-semibold text-orange-400">Coûts & marge du fournisseur (DDU)</Label>
        <div className="grid md:grid-cols-3 gap-4">
          <div><Label>Stockage/Hospitalité</Label><Input type="number" step="0.01" {...register("supplier.storageHospitalityUSD", { valueAsNumber: true })} /></div>
          <div><Label>ANR-Déchargement</Label><Input type="number" step="0.01" {...register("supplier.anrDechargementUSD", { valueAsNumber: true })} /></div>
          <div>
            <Label>Marge fournisseur</Label>
            <Input type="number" step="0.01" {...register("supplier.supplierMarginUSD", { valueAsNumber: true, min: 40 })} />
            {errors?.supplier?.supplierMarginUSD && (
              <p className="text-red-500 text-sm">{String(errors.supplier?.supplierMarginUSD?.message ?? "La marge ne doit pas être inférieure à 40")}</p>
            )}
          </div>
          <div><Label>Frais d&apos;Escorte (USD)</Label><Input type="number" step="0.01" {...register("supplier.escortFeesUSD", { valueAsNumber: true })} /></div>
          <div><Label>Intérêts Ligne Banque (USD)</Label><Input type="number" step="0.01" {...register("supplier.bankInterestUSD", { valueAsNumber: true })} /></div>
          <div><Label>Prix DDU (auto)</Label><Input type="number" step="0.01" value={Number.isFinite(priceDDU) ? priceDDU : 0} disabled /></div>
        </div>

        <Label className="text-lg font-semibold text-orange-400">Coûts collectés par la douane</Label>
        <div className="grid md:grid-cols-3 gap-4">
          <div><Label>Droits de douane</Label><Input type="number" step="0.01" {...register("customs.customsDutyUSD", { valueAsNumber: true })} /></div>
          <div><Label>TVA import</Label><Input type="number" step="0.01" {...register("customs.importVATUSD", { valueAsNumber: true })} /></div>
          <div><Label>Sous-total</Label><Input type="number" step="0.01" {...register("customs.subtotalUSD", { valueAsNumber: true })} /></div>
        </div>

        <Label className="text-lg font-semibold text-orange-400">Redevances (Levies)</Label>
        <div className="grid md:grid-cols-3 gap-4">
          <div><Label>FONER</Label><Input type="number" step="0.01" {...register("levies.fonerUSD", { valueAsNumber: true })} /></div>
          <div><Label>Stock Séc. / Moléculaire</Label><Input type="number" step="0.01" {...register("levies.molecularMarkingOrStockUSD", { valueAsNumber: true })} /></div>
          <div><Label>Reconstruction & Stratégique</Label><Input type="number" step="0.01" {...register("levies.reconstructionStrategicUSD", { valueAsNumber: true })} /></div>
          <div><Label>Intervention Éco. & Autres</Label><Input type="number" step="0.01" {...register("levies.economicInterventionUSD", { valueAsNumber: true })} /></div>
          <div><Label>Total Droits & TVA</Label><Input type="number" step="0.01" {...register("levies.totalDutiesAndVATUSD", { valueAsNumber: true })} /></div>
          <div><Label>Total Redevances</Label><Input type="number" step="0.01" {...register("levies.totalLeviesUSD", { valueAsNumber: true })} /></div>
        </div>

        <Label className="text-lg font-semibold text-orange-400">Coûts de transport additionnels</Label>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <Label>Freight to Mine</Label>
            <Select
              value={selectedTransportRateId || ""}
              onValueChange={(id) => {
                setSelectedTransportRateId(id);
                const rate = transportRates.find((t) => t.id === id)?.rateUsdPerCbm ?? 0;
                setValue("transport.freightToMineUSD", Number(rate), { shouldDirty: true });
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
          <div><Label>Pertes (L/ camion)</Label><Input type="number" step="0.01" {...register("transport.lossesLitresPerTruck", { valueAsNumber: true })} /></div>
          <div><Label>Total transport final (auto)</Label><Input type="number" step="0.01" value={Number.isFinite(totalTransportFinalUSDRounded) ? totalTransportFinalUSDRounded : 0} disabled /></div>
        </div>

        <Label className="text-lg font-semibold text-orange-400">Récapitulatif</Label>
        <div className="grid md:grid-cols-4 gap-4">
          <div><Label>Total Douanes (auto)</Label><Input type="number" step="0.01" value={Number.isFinite(totalCustomsUSDRounded) ? totalCustomsUSDRounded : 0} disabled /></div>
          <div><Label>Total Redevances (auto)</Label><Input type="number" step="0.01" value={Number.isFinite(totalLeviesUSDRounded) ? totalLeviesUSDRounded : 0} disabled /></div>
          <div><Label>Prix DDU (auto)</Label><Input type="number" step="0.01" value={Number.isFinite(round1(priceDDU)) ? round1(priceDDU) : 0} disabled /></div>
          <div><Label>Prix DDP (auto)</Label><Input type="number" step="0.01" value={Number.isFinite(priceDDP) ? priceDDP : 0} disabled /></div>
        </div>

        <div className="hidden md:flex justify-end">
          <Button type="submit" disabled={isPending}>{isPending ? "Enregistrement..." : "Enregistrer"}</Button>
        </div>
      </form>
      {/* Mobile sticky action bar */}
      <div className="md:hidden fixed bottom-[56px] inset-x-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3">
        <div className="flex gap-2">
          <Button className="flex-1" type="button" disabled={isPending} onClick={() => (document.getElementById("builder-create-form") as HTMLFormElement | null)?.requestSubmit()}>
            {isPending ? "..." : "Enregistrer"}
          </Button>
        </div>
      </div>
    </div>
  );
}


