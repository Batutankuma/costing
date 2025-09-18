"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UpdateCostBuildUpSchema } from "@/models/mvc.pruned";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAction } from "next-safe-action/hooks";
import { updateBuilder } from "../actions";
import { useRouter } from "next/navigation";

type FormData = z.infer<typeof UpdateCostBuildUpSchema>;

export default function BuilderEditForm({ item }: { item: any }) {
  const router = useRouter();
  const { executeAsync, status } = useAction(updateBuilder);
  const isPending = status === "executing";

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(UpdateCostBuildUpSchema as any),
    defaultValues: {
      id: item.id,
      title: item.title,
      unit: item.unit,
      priceReferenceId: item.priceReferenceId ?? undefined,
      base: {
        plattsFOBUSD: item.baseCosts?.plattsFOBUSD ?? 0,
        truckTransportUSD: item.baseCosts?.truckTransportUSD ?? 0,
        brutCFUSD: item.baseCosts?.brutCFUSD ?? 0,
        agencyCustomsUSD: item.baseCosts?.agencyCustomsUSD ?? 0,
        acquisitionCostUSD: item.baseCosts?.acquisitionCostUSD ?? 0,
      },
      supplier: {
        storageHospitalityUSD: item.supplierDDU?.storageHospitalityUSD ?? 0,
        anrDechargementUSD: item.supplierDDU?.anrDechargementUSD ?? 0,
        supplierMarginUSD: item.supplierDDU?.supplierMarginUSD ?? 0,
        sellingPriceDDUUSD: item.supplierDDU?.sellingPriceDDUUSD ?? 0,
      },
      customs: {
        customsDutyUSD: item.customs?.customsDutyUSD ?? 0,
        importVATUSD: item.customs?.importVATUSD ?? 0,
        subtotalUSD: item.customs?.subtotalUSD ?? 0,
      },
      levies: {
        fonerUSD: item.levies?.fonerUSD ?? 0,
        molecularMarkingOrStockUSD: item.levies?.molecularMarkingOrStockUSD ?? 0,
        reconstructionStrategicUSD: item.levies?.reconstructionStrategicUSD ?? 0,
        economicInterventionUSD: item.levies?.economicInterventionUSD ?? 0,
        totalDutiesAndVATUSD: item.levies?.totalDutiesAndVATUSD ?? 0,
        totalLeviesUSD: item.levies?.totalLeviesUSD ?? 0,
      },
      transport: {
        freightToMineUSD: item.transport?.freightToMineUSD ?? 0,
        lossesLitresPerTruck: item.transport?.lossesLitresPerTruck ?? 0,
        totalTransportFinalUSD: item.transport?.totalTransportFinalUSD ?? 0,
      },
      totals: {
        totalCustomsUSD: item.totals?.totalCustomsUSD ?? 0,
        totalLeviesUSD: item.totals?.totalLeviesUSD ?? 0,
        priceDDUUSD: item.totals?.priceDDUUSD ?? 0,
        priceDDPUSD: item.totals?.priceDDPUSD ?? 0,
      },
    },
  });

  // Autos (comme create)
  const plattsFOB = watch("base.plattsFOBUSD") || 0;
  const truckTrans = watch("base.truckTransportUSD") || 0;
  const agencyCustoms = watch("base.agencyCustomsUSD") || 0;
  const brutCF = Number(plattsFOB || 0) + Number(truckTrans || 0);
  React.useEffect(() => { setValue("base.brutCFUSD", brutCF as any, { shouldDirty: false }); }, [brutCF, setValue]);
  const acquisitionCost = Number(plattsFOB || 0) + Number(truckTrans || 0) + Number(agencyCustoms || 0);
  React.useEffect(() => { setValue("base.acquisitionCostUSD", acquisitionCost as any, { shouldDirty: false }); }, [acquisitionCost, setValue]);

  const storageHosp = watch("supplier.storageHospitalityUSD") || 0;
  const anr = watch("supplier.anrDechargementUSD") || 0;
  const marginSupp = watch("supplier.supplierMarginUSD") || 0;
  const priceDDU = Number(acquisitionCost || 0) + Number(storageHosp || 0) + Number(anr || 0) + Number(marginSupp || 0);
  React.useEffect(() => { setValue("supplier.sellingPriceDDUUSD", priceDDU as any, { shouldDirty: false }); }, [priceDDU, setValue]);

  const customsDutyUSD = watch("customs.customsDutyUSD") || 0;
  const importVATUSD = watch("customs.importVATUSD") || 0;
  const totalCustomsUSD = Number(customsDutyUSD || 0) + Number(importVATUSD || 0);
  React.useEffect(() => { setValue("customs.subtotalUSD", totalCustomsUSD as any, { shouldDirty: false }); setValue("totals.totalCustomsUSD", totalCustomsUSD as any, { shouldDirty: false }); }, [totalCustomsUSD, setValue]);

  const fonerUSD = watch("levies.fonerUSD") || 0;
  const molecularOrStockUSD = watch("levies.molecularMarkingOrStockUSD") || 0;
  const reconstructionUSD = watch("levies.reconstructionStrategicUSD") || 0;
  const interventionUSD = watch("levies.economicInterventionUSD") || 0;
  const totalLeviesUSD = [fonerUSD, molecularOrStockUSD, reconstructionUSD, interventionUSD].map((n) => Number(n || 0)).reduce((a, b) => a + b, 0);
  React.useEffect(() => { setValue("levies.totalLeviesUSD", totalLeviesUSD as any, { shouldDirty: false }); setValue("totals.totalLeviesUSD", totalLeviesUSD as any, { shouldDirty: false }); }, [totalLeviesUSD, setValue]);

  const freightToMineUSD = watch("transport.freightToMineUSD") || 0;
  const lossesLitresPerTruck = watch("transport.lossesLitresPerTruck") || 0;
  const totalTransportFinalUSD = Number(freightToMineUSD || 0) + Number(lossesLitresPerTruck || 0);
  React.useEffect(() => { setValue("transport.totalTransportFinalUSD", totalTransportFinalUSD as any, { shouldDirty: false }); }, [totalTransportFinalUSD, setValue]);

  const priceDDP = Number(priceDDU || 0) + Number(totalCustomsUSD || 0) + Number(totalLeviesUSD || 0) + Number(totalTransportFinalUSD || 0);
  React.useEffect(() => { setValue("totals.priceDDUUSD", priceDDU as any, { shouldDirty: false }); setValue("totals.priceDDPUSD", priceDDP as any, { shouldDirty: false }); }, [priceDDU, priceDDP, setValue]);

  const onSubmit = async (data: any) => {
    const res = await executeAsync(data);
    if ((res as any)?.data?.success) {
      router.push("/dashboard/builders");
    }
  };

  return (
    <form id="builder-edit-form" onSubmit={handleSubmit(onSubmit as any)} className="grid gap-6 pb-24">
      <div className="grid md:grid-cols-2 gap-2">
        <div>
          <Label>Titre</Label>
          <Input {...register("title")} />
          {errors.title && <p className="text-red-500 text-sm">{String((errors as any).title?.message)}</p>}
        </div>
        <div>
          <Label>Unité</Label>
          <select className="h-9 w-full rounded-md border border-border bg-background px-3" defaultValue={item.unit} {...register("unit")}>
            <option value="USD_M3">USD / M3</option>
            <option value="USD_LITRE">USD / Litre</option>
          </select>
        </div>
      </div>

      <Label className="text-lg font-semibold text-orange-400">Coûts de base du produit & transport initial</Label>
      <div className="grid md:grid-cols-5 gap-4">
        <div><Label>Platt's/FOB</Label><Input type="number" step="0.01" {...register("base.plattsFOBUSD", { valueAsNumber: true })} /></div>
        <div><Label>Transport (camion)</Label><Input type="number" step="0.01" {...register("base.truckTransportUSD", { valueAsNumber: true })} /></div>
        <div><Label>Brut C&F (auto)</Label><Input type="number" step="0.01" value={Number.isFinite(brutCF) ? brutCF : 0} disabled /></div>
        <div><Label>Agency/Customs</Label><Input type="number" step="0.01" {...register("base.agencyCustomsUSD", { valueAsNumber: true })} /></div>
        <div><Label>Prix de revient (auto)</Label><Input type="number" step="0.01" value={Number.isFinite(acquisitionCost) ? acquisitionCost : 0} disabled /></div>
      </div>

      <Label className="text-lg font-semibold text-orange-400">Coûts & marge du fournisseur (DDU)</Label>
      <div className="grid md:grid-cols-4 gap-4">
        <div><Label>Stockage/Hospitalité</Label><Input type="number" step="0.01" {...register("supplier.storageHospitalityUSD", { valueAsNumber: true })} /></div>
        <div><Label>ANR-Déchargement</Label><Input type="number" step="0.01" {...register("supplier.anrDechargementUSD", { valueAsNumber: true })} /></div>
        <div><Label>Marge fournisseur</Label><Input type="number" step="0.01" {...register("supplier.supplierMarginUSD", { valueAsNumber: true })} /></div>
        <div><Label>Prix DDU (auto)</Label><Input type="number" step="0.01" value={Number.isFinite(priceDDU) ? priceDDU : 0} disabled /></div>
      </div>

      <Label className="text-lg font-semibold text-orange-400">Coûts collectés par la douane</Label>
      <div className="grid md:grid-cols-3 gap-4">
        <div><Label>Droits de douane</Label><Input type="number" step="0.01" {...register("customs.customsDutyUSD", { valueAsNumber: true })} /></div>
        <div><Label>TVA import</Label><Input type="number" step="0.01" {...register("customs.importVATUSD", { valueAsNumber: true })} /></div>
        <div><Label>Total Douanes (auto)</Label><Input type="number" step="0.01" value={Number.isFinite(totalCustomsUSD) ? totalCustomsUSD : 0} disabled /></div>
      </div>

      <Label className="text-lg font-semibold text-orange-400">Redevances (Levies)</Label>
      <div className="grid md:grid-cols-3 gap-4">
        <div><Label>FONER</Label><Input type="number" step="0.01" {...register("levies.fonerUSD", { valueAsNumber: true })} /></div>
        <div><Label>Stock Séc. / Moléculaire</Label><Input type="number" step="0.01" {...register("levies.molecularMarkingOrStockUSD", { valueAsNumber: true })} /></div>
        <div><Label>Reconstruction & Stratégique</Label><Input type="number" step="0.01" {...register("levies.reconstructionStrategicUSD", { valueAsNumber: true })} /></div>
        <div><Label>Intervention Éco. & Autres</Label><Input type="number" step="0.01" {...register("levies.economicInterventionUSD", { valueAsNumber: true })} /></div>
        <div><Label>Total Redevances (auto)</Label><Input type="number" step="0.01" value={Number.isFinite(totalLeviesUSD) ? totalLeviesUSD : 0} disabled /></div>
      </div>

      <Label className="text-lg font-semibold text-orange-400">Transport additionnel</Label>
      <div className="grid md:grid-cols-3 gap-4">
        <div><Label>Freight to Mine</Label><Input type="number" step="0.01" {...register("transport.freightToMineUSD", { valueAsNumber: true })} /></div>
        <div><Label>Pertes (L)</Label><Input type="number" step="0.01" {...register("transport.lossesLitresPerTruck", { valueAsNumber: true })} /></div>
        <div><Label>Total transport final (auto)</Label><Input type="number" step="0.01" value={Number.isFinite(totalTransportFinalUSD) ? totalTransportFinalUSD : 0} disabled /></div>
      </div>

      <Label className="text-lg font-semibold text-orange-400">Récapitulatif</Label>
      <div className="grid md:grid-cols-4 gap-4">
        <div><Label>Total Douanes</Label><Input disabled value={totalCustomsUSD} /></div>
        <div><Label>Total Redevances</Label><Input disabled value={totalLeviesUSD} /></div>
        <div><Label>Prix DDU</Label><Input disabled value={priceDDU} /></div>
        <div><Label>Prix DDP</Label><Input disabled value={priceDDP} /></div>
      </div>

      <div className="hidden md:flex justify-end">
        <Button type="submit" disabled={isPending}>{isPending ? "Mise à jour..." : "Mettre à jour"}</Button>
      </div>
      {/* Mobile sticky action bar */}
      <div className="md:hidden fixed bottom-[56px] inset-x-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3">
        <div className="flex gap-2">
          <Button className="flex-1" type="button" disabled={isPending} onClick={() => (document.getElementById("builder-edit-form") as HTMLFormElement | null)?.requestSubmit()}>
            {isPending ? "..." : "Mettre à jour"}
          </Button>
        </div>
      </div>
    </form>
  );
}


