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
  const [refs, setRefs] = React.useState<any[]>([]);
  const [nonMiningPrices, setNonMiningPrices] = React.useState<any[]>([]);
  const [selectedRefId, setSelectedRefId] = React.useState<string>("");
  const [selectedNonMiningId, setSelectedNonMiningId] = React.useState<string>("");

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(CreateCostBuildUpSchema as any),
    defaultValues: {
      title: "",
      unit: "USD_M3" as any,
      userId: "",
    },
  });

  // Options: local price and transport rates
  const [useLocalPrice, setUseLocalPrice] = React.useState(false);
  const [localAcquisitionCostUSD, setLocalAcquisitionCostUSD] = React.useState<number>(0);
  const [transportRates, setTransportRates] = React.useState<Array<{ id: string; destination: string; rateUsdPerCbm: number }>>([]);

  React.useEffect(() => {
    if (session?.user?.id) {
      setValue("userId", session.user.id as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
    }
  }, [session?.user?.id, setValue]);

  React.useEffect(() => {
    (async () => {
      const res = await loadRefs();
      const items = (res as any)?.data?.result ?? [];
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

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/non-mining-prices", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setNonMiningPrices(Array.isArray(data) ? data : []);
        } else {
          setNonMiningPrices([]);
        }
      } catch {
        setNonMiningPrices([]);
      }
    })();
  }, []);

  const round1 = React.useCallback((n: any) => {
    const v = Number(n ?? 0);
    return Number.isFinite(v) ? Math.round(v * 10) / 10 : 0;
  }, []);

  const applyFromPriceRef = React.useCallback((refItem: any) => {
    if (!refItem) return;
    const rate = refItem?.exchangeRate?.rate ?? 0;
    const toUSD = (v?: number | null) => (typeof v === "number" && rate > 0 ? v / rate : undefined);
    // Customs from fiscality
    const cd = round1(toUSD(refItem?.fiscality?.customsDuty ?? undefined));
    const iv = round1(toUSD(refItem?.fiscality?.importVAT ?? undefined));
    const subtotal = round1((cd ?? 0) + (iv ?? 0));
    setValue("customs.customsDutyUSD", cd as any);
    setValue("customs.importVATUSD", iv as any);
    setValue("customs.subtotalUSD", subtotal as any);
    // Levies from parafiscality
    const pf = refItem?.parafiscality ?? {};
    setValue("levies.fonerUSD", round1(toUSD(pf.foner)) as any);
    const combinedCDF = Number(pf.stockSecurity1 ?? 0) + Number(pf.stockSecurity2 ?? 0) + Number(pf.molecularMarking ?? 0);
    const combinedUSD = round1(toUSD(combinedCDF) ?? 0);
    setValue("levies.molecularMarkingOrStockUSD", combinedUSD as any);
    setValue("levies.reconstructionStrategicUSD", round1(toUSD(pf.reconstructionEffort)) as any);
    setValue("levies.economicInterventionUSD", round1(toUSD(pf.intervention)) as any);
    const totalLevies = round1((round1(toUSD(pf.foner)) ?? 0) + combinedUSD + (round1(toUSD(pf.reconstructionEffort)) ?? 0) + (round1(toUSD(pf.intervention)) ?? 0));
    setValue("levies.totalLeviesUSD", totalLevies as any);
    // Totals convenience
    setValue("totals.totalCustomsUSD", subtotal as any);
  }, [round1, setValue]);

  const applyFromNonMiningPrice = React.useCallback((nonMiningItem: any) => {
    if (!nonMiningItem) return;
    const rate = nonMiningItem?.exchangeRate?.rate ?? 2500;
    const toUSD = (v?: number | null) => (typeof v === "number" && rate > 0 ? v / rate : undefined);
    
    // Customs from fiscality
    const cd = round1(toUSD(nonMiningItem?.fiscality?.customsDuty ?? undefined));
    const iv = round1(toUSD(nonMiningItem?.fiscality?.importVAT ?? undefined));
    const subtotal = round1((cd ?? 0) + (iv ?? 0));
    setValue("customs.customsDutyUSD", cd as any);
    setValue("customs.importVATUSD", iv as any);
    setValue("customs.subtotalUSD", subtotal as any);
    
    // Levies from parafiscality
    const pf = nonMiningItem?.parafiscality ?? {};
    setValue("levies.fonerUSD", round1(toUSD(pf.foner)) as any);
    
    // Stock de sécurité (EST + SUD)
    const estStock = nonMiningItem?.securityStock?.estStock ?? 0;
    const sudStock = nonMiningItem?.securityStock?.sudStock ?? 0;
    const totalStock = round1(toUSD(estStock + sudStock) ?? 0);
    setValue("levies.molecularMarkingOrStockUSD", totalStock as any);
    
    // PMF Fiscal (peut être négatif)
    const pmfFiscal = nonMiningItem?.parafiscality?.pmfFiscal ?? 0;
    setValue("levies.reconstructionStrategicUSD", round1(toUSD(pmfFiscal)) as any);
    
    // Pas d'intervention économique pour non-minier
    setValue("levies.economicInterventionUSD", 0 as any);
    
    const totalLevies = round1((round1(toUSD(pf.foner)) ?? 0) + totalStock + (round1(toUSD(pmfFiscal)) ?? 0));
    setValue("levies.totalLeviesUSD", totalLevies as any);
    
    // Totals convenience
    setValue("totals.totalCustomsUSD", subtotal as any);
  }, [round1, setValue]);

  // Auto: Brut C&F = Platt's/FOB + Transport (camion)
  const plattsFOB = watch("base.plattsFOBUSD") || 0;
  const truckTrans = watch("base.truckTransportUSD") || 0;
  const agencyCustoms = watch("base.agencyCustomsUSD") || 0;
  const brutCF = useLocalPrice ? 0 : (Number(plattsFOB || 0) + Number(truckTrans || 0));
  React.useEffect(() => {
    setValue("base.brutCFUSD", brutCF as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [brutCF, setValue]);

  // Auto: Prix de revient = Platt's/FOB + Transport (camion) + Agency/Customs
  const acquisitionCost = useLocalPrice ? Number(localAcquisitionCostUSD || 0) : (Number(plattsFOB || 0) + Number(truckTrans || 0) + Number(agencyCustoms || 0));
  React.useEffect(() => {
    setValue("base.acquisitionCostUSD", acquisitionCost as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [acquisitionCost, setValue]);

  // Auto: Prix DDU = Prix de revient + Stockage/Hospitalité + ANR-Déchargement + Marge fournisseur
  const storageHosp = watch("supplier.storageHospitalityUSD") || 0;
  const anr = watch("supplier.anrDechargementUSD") || 0;
  const marginSupp = watch("supplier.supplierMarginUSD") || 0;
  const priceDDU = Number(acquisitionCost || 0) + Number(storageHosp || 0) + Number(anr || 0) + Number(marginSupp || 0);
  React.useEffect(() => {
    setValue("supplier.sellingPriceDDUUSD", priceDDU as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [priceDDU, setValue]);

  // Customs total (auto)
  const customsDutyUSD = watch("customs.customsDutyUSD") || 0;
  const importVATUSD = watch("customs.importVATUSD") || 0;
  const totalCustomsUSD = Number(customsDutyUSD || 0) + Number(importVATUSD || 0);
  const totalCustomsUSDRounded = round1(totalCustomsUSD);
  React.useEffect(() => {
    setValue("customs.subtotalUSD", totalCustomsUSDRounded as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
    setValue("totals.totalCustomsUSD", totalCustomsUSDRounded as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
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
    setValue("levies.totalLeviesUSD", totalLeviesUSDRounded as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
    setValue("totals.totalLeviesUSD", totalLeviesUSDRounded as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [totalLeviesUSDRounded, setValue]);

  // Transport final total (auto)
  const freightToMineUSD = watch("transport.freightToMineUSD") || 0;
  const lossesLitresPerTruck = watch("transport.lossesLitresPerTruck") || 0;
  const totalTransportFinalUSD = Number(freightToMineUSD || 0) + Number(lossesLitresPerTruck || 0);
  const totalTransportFinalUSDRounded = round1(totalTransportFinalUSD);
  React.useEffect(() => {
    setValue("transport.totalTransportFinalUSD", totalTransportFinalUSDRounded as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [totalTransportFinalUSDRounded, setValue]);

  // Price DDP (auto) = DDU + Douanes + Redevances + Transport final
  const priceDDPRaw = Number(priceDDU || 0) + Number(totalCustomsUSDRounded || 0) + Number(totalLeviesUSDRounded || 0) + Number(totalTransportFinalUSDRounded || 0);
  const priceDDP = round1(priceDDPRaw);
  React.useEffect(() => {
    setValue("totals.priceDDUUSD", round1(priceDDU) as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
    setValue("totals.priceDDPUSD", priceDDP as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [priceDDU, priceDDP, round1, setValue]);

  const onSubmit = async (data: any) => {
    const res = await executeAsync(data);
    if ((res as any)?.data?.success) {
      router.push("/dashboard/builders");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Créer un builder</h1>
      <form onSubmit={handleSubmit(onSubmit as any)} className="grid gap-6">
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
                setSelectedNonMiningId(""); // Réinitialiser l'autre sélection
                setValue("priceReferenceId", id as any);
                setValue("nonMiningPriceStructureId", null as any);
                const found = refs.find((r) => r.id === id);
                applyFromPriceRef(found);
              }}
            >
              <option value="">— Sélectionner structure minier —</option>
              {refs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nomStructure} — {new Date(r.date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Structure officielle (Non-Minier)</Label>
            <select
              className="h-9 w-full rounded-md border border-border bg-background px-3"
              value={selectedNonMiningId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedNonMiningId(id);
                setSelectedRefId(""); // Réinitialiser l'autre sélection
                setValue("nonMiningPriceStructureId", id as any);
                setValue("priceReferenceId", null as any);
                const found = nonMiningPrices.find((r) => r.id === id);
                applyFromNonMiningPrice(found);
              }}
            >
              <option value="">— Sélectionner structure non-minier —</option>
              {nonMiningPrices.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nomStructure} — {r.cardinale} — {new Date(r.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>
        <input type="hidden" {...register("userId")} />
        <input type="hidden" {...register("priceReferenceId")} />
        <input type="hidden" {...register("nonMiningPriceStructureId")} />

        <Label className="text-lg font-semibold text-orange-400">Coûts de base du produit & transport initial</Label>
        <div className="grid md:grid-cols-5 gap-4">
          <div className="col-span-5 flex items-center gap-2">
            <input id="useLocalPrice" type="checkbox" checked={useLocalPrice} onChange={(e) => setUseLocalPrice(e.target.checked)} />
            <Label htmlFor="useLocalPrice">Saisir directement le prix de revient (local)</Label>
          </div>
          {useLocalPrice && (
            <div className="col-span-5"><Label>Prix de revient (USD)</Label><Input type="number" step="0.01" value={localAcquisitionCostUSD} onChange={(e) => setLocalAcquisitionCostUSD(Number(e.target.value || 0))} /></div>
          )}
          <div><Label>Platt's/FOB</Label><Input type="number" step="0.01" {...register("base.plattsFOBUSD", { valueAsNumber: true })} disabled={useLocalPrice} /></div>
          <div><Label>Transport (camion)</Label><Input type="number" step="0.01" {...register("base.truckTransportUSD", { valueAsNumber: true })} disabled={useLocalPrice} /></div>
          <div><Label>Brut C&F (auto)</Label><Input type="number" step="0.01" value={Number.isFinite(brutCF) ? brutCF : 0} disabled /></div>
          <div><Label>Agency/Customs</Label><Input type="number" step="0.01" {...register("base.agencyCustomsUSD", { valueAsNumber: true })} disabled={useLocalPrice} /></div>
          <div><Label>Prix de revient (auto)</Label><Input type="number" step="0.01" value={Number.isFinite(acquisitionCost) ? acquisitionCost : 0} disabled /></div>
        </div>

        <Label className="text-lg font-semibold text-orange-400">Coûts & marge du fournisseur (DDU)</Label>
        <div className="grid md:grid-cols-4 gap-4">
          <div><Label>Stockage/Hospitalité</Label><Input type="number" step="0.01" {...register("supplier.storageHospitalityUSD", { valueAsNumber: true })} /></div>
          <div><Label>ANR-Déchargement</Label><Input type="number" step="0.01" {...register("supplier.anrDechargementUSD", { valueAsNumber: true })} /></div>
          <div>
            <Label>Marge fournisseur</Label>
            <Input type="number" step="0.01" {...register("supplier.supplierMarginUSD", { valueAsNumber: true, min: 40 })} />
            {errors?.supplier?.supplierMarginUSD && (
              <p className="text-red-500 text-sm">{String((errors as any).supplier?.supplierMarginUSD?.message ?? "La marge ne doit pas être inférieure à 40")}</p>
            )}
          </div>
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
              value={String(watch("transport.freightToMineUSD") || "")}
              onValueChange={(v) => setValue("transport.freightToMineUSD", Number(v) as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un tarif" />
              </SelectTrigger>
              <SelectContent>
                {transportRates.length === 0 ? (
                  <SelectItem value="0">0</SelectItem>
                ) : (
                  transportRates.map((t) => (
                    <SelectItem key={t.id} value={String(t.rateUsdPerCbm)}>
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

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>{isPending ? "Enregistrement..." : "Enregistrer"}</Button>
        </div>
      </form>
    </div>
  );
}


