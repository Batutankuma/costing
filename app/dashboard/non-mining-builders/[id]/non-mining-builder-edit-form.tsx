"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { updateNonMiningBuilder } from "../actions";
import { useToast } from "@/hooks/use-toast";

const BaseSchema = z.object({
  plattsFOBUSD: z.number().optional(),
  truckTransportUSD: z.number().optional(),
  brutCFUSD: z.number().optional(),
  agencyCustomsUSD: z.number().optional(),
  acquisitionCostUSD: z.number().optional(),
}).partial();

const SupplierSchema = z.object({
  storageHospitalityUSD: z.number().optional(),
  anrDechargementUSD: z.number().optional(),
  supplierMarginUSD: z.number().optional(),
  escortFeesUSD: z.number().optional(),
  bankInterestUSD: z.number().optional(),
  sellingPriceDDUUSD: z.number().optional(),
}).partial();

const CustomsSchema = z.object({
  customsDutyUSD: z.number().optional(),
  importVATUSD: z.number().optional(),
  internalVATUSD: z.number().optional(),
  consumptionDutyUSD: z.number().optional(),
  subtotalUSD: z.number().optional(),
}).partial();

const LeviesSchema = z.object({
  roadFundFonerUSD: z.number().optional(),
  stockSecuritySudUSD: z.number().optional(),
  reconstructionEffortUSD: z.number().optional(),
  economicInterventionUSD: z.number().optional(),
  totalLeviesUSD: z.number().optional(),
}).partial();

const AdditionalTransportSchema = z.object({
  freightToMineUSD: z.number().optional(),
  lossesUSD: z.number().optional(),
  totalTransportUSD: z.number().optional(),
}).partial();

const FinalPricingSchema = z.object({
  dduPriceUSD: z.number().optional(),
  ddpPriceUSD: z.number().optional(),
}).partial();

const NonMiningBuilderEditSchema = z.object({
  id: z.string(),
  userId: z.string().min(1, "Utilisateur requis"),
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  unit: z.enum(["USD_M3", "USD_LITRE"]),
  nonMiningPriceStructureId: z.string().optional(),
  base: BaseSchema.optional(),
  supplier: SupplierSchema.optional(),
  customs: CustomsSchema.optional(),
  levies: LeviesSchema.optional(),
  additionalTransport: AdditionalTransportSchema.optional(),
  finalPricing: FinalPricingSchema.optional(),
});

type NonMiningBuilderEditFormData = z.infer<typeof NonMiningBuilderEditSchema>;

interface NonMiningBuilderEditFormProps {
  builder: {
    id: string;
    title: string;
    description: string | null;
    unit: string;
    nonMiningPriceStructureId: string | null;
    baseCosts?: {
      plattsFOBUSD?: number | null;
      truckTransportUSD?: number | null;
      brutCFUSD?: number | null;
      agencyCustomsUSD?: number | null;
      acquisitionCostUSD?: number | null;
    } | null;
    supplierDDU?: {
      storageHospitalityUSD?: number | null;
      anrDechargementUSD?: number | null;
      supplierMarginUSD?: number | null;
      sellingPriceDDUUSD?: number | null;
    } | null;
    customs?: {
      customsDutyUSD?: number | null;
      importVATUSD?: number | null;
      internalVATUSD?: number | null;
      consumptionDutyUSD?: number | null;
      subtotalUSD?: number | null;
    } | null;
    levies?: {
      roadFundFonerUSD?: number | null;
      stockSecuritySudUSD?: number | null;
      reconstructionEffortUSD?: number | null;
      economicInterventionUSD?: number | null;
      totalLeviesUSD?: number | null;
    } | null;
    transport?: {
      freightToMineUSD?: number | null;
      lossesUSD?: number | null;
      totalTransportUSD?: number | null;
    } | null;
    totals?: {
      totalCustomsUSD?: number | null;
      totalLeviesUSD?: number | null;
      priceDDUUSD?: number | null;
      priceDDPUSD?: number | null;
    } | null;
  };
  priceStructures: Array<{
    id: string;
    nomStructure: string;
    exchangeRate: {
      rate: number;
      deviseBase: string;
      deviseTarget: string;
    };
    fiscality?: {
      customsDuty: number;
      importVAT: number;
      netVAT: number;
      consumptionDuty: number;
    };
    parafiscality?: {
      foner: number;
    };
    securityStock?: {
      estStock: number;
      sudStock: number;
    };
  }>;
}

export function NonMiningBuilderEditForm({ builder, priceStructures }: NonMiningBuilderEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { data: session } = authClient.useSession();
  const [transportRates, setTransportRates] = useState<Array<{ id: string; destination: string; rateUsdPerCbm: number }>>([]);
  const [selectedTransportRateId, setSelectedTransportRateId] = useState<string>("");

  const form = useForm<NonMiningBuilderEditFormData>({
    resolver: zodResolver(NonMiningBuilderEditSchema),
    defaultValues: {
      id: builder.id,
      userId: "",
      title: builder.title,
      description: builder.description || "",
      unit: builder.unit as "USD_M3" | "USD_LITRE",
      nonMiningPriceStructureId: builder.nonMiningPriceStructureId || "",
      base: builder.baseCosts ? {
        plattsFOBUSD: builder.baseCosts.plattsFOBUSD ?? 0,
        truckTransportUSD: builder.baseCosts.truckTransportUSD ?? 0,
        brutCFUSD: builder.baseCosts.brutCFUSD ?? 0,
        agencyCustomsUSD: builder.baseCosts.agencyCustomsUSD ?? 0,
        acquisitionCostUSD: builder.baseCosts.acquisitionCostUSD ?? 0,
      } : undefined,
      supplier: builder.supplierDDU ? {
        storageHospitalityUSD: builder.supplierDDU.storageHospitalityUSD ?? 0,
        anrDechargementUSD: builder.supplierDDU.anrDechargementUSD ?? 0,
        supplierMarginUSD: builder.supplierDDU.supplierMarginUSD ?? 0,
        escortFeesUSD: (builder.supplierDDU as any)?.escortFeesUSD ?? 0,
        bankInterestUSD: (builder.supplierDDU as any)?.bankInterestUSD ?? 0,
        sellingPriceDDUUSD: builder.supplierDDU.sellingPriceDDUUSD ?? 0,
      } : undefined,
      customs: builder.customs ? {
        customsDutyUSD: builder.customs.customsDutyUSD ?? 0,
        importVATUSD: builder.customs.importVATUSD ?? 0,
        internalVATUSD: (builder.customs as any)?.internalVATUSD ?? 0,
        consumptionDutyUSD: (builder.customs as any)?.consumptionDutyUSD ?? 0,
        subtotalUSD: builder.customs.subtotalUSD ?? 0,
      } : undefined,
      levies: builder.levies ? {
        roadFundFonerUSD: (builder.levies as any)?.fonerUSD ?? 0,
        stockSecuritySudUSD: (builder.levies as any)?.molecularMarkingOrStockUSD ?? 0,
        reconstructionEffortUSD: (builder.levies as any)?.reconstructionStrategicUSD ?? 0,
        economicInterventionUSD: (builder.levies as any)?.economicInterventionUSD ?? 0,
        totalLeviesUSD: (builder.levies as any)?.totalLeviesUSD ?? 0,
      } : undefined,
      additionalTransport: builder.transport ? {
        freightToMineUSD: builder.transport.freightToMineUSD ?? 0,
        lossesUSD: (builder.transport as any)?.lossesLitresPerTruck ?? 0,
        totalTransportUSD: (builder.transport as any)?.totalTransportFinalUSD ?? 0,
      } : undefined,
      finalPricing: builder.totals ? {
        dduPriceUSD: builder.totals.priceDDUUSD ?? 0,
        ddpPriceUSD: builder.totals.priceDDPUSD ?? 0,
      } : undefined,
    },
  });

  React.useEffect(() => {
    if (session?.user?.id) {
      form.setValue("userId", session.user.id, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
    }
  }, [session?.user?.id]);

  // When a structure is already selected (initial load) or changes, apply its values
  React.useEffect(() => {
    const current = form.getValues("nonMiningPriceStructureId") as string | undefined;
    if (current) {
      applyFromNonMiningPrice(current);
    }
  }, [form.watch("nonMiningPriceStructureId")]);

  // Load transport rates and preselect based on current value
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/transport-rates", { cache: "no-store" });
        if (res.ok) {
          const list = await res.json();
          const items = Array.isArray(list) ? list : [];
          setTransportRates(items);
        }
      } catch {
        setTransportRates([]);
      }
    })();
  }, []);

  React.useEffect(() => {
    if (!transportRates.length) return;
    const currentFreight = Number(form.getValues("additionalTransport.freightToMineUSD") || 0);
    const match = transportRates.find((t) => Number(t.rateUsdPerCbm) === currentFreight);
    if (match?.id) setSelectedTransportRateId(match.id);
  }, [transportRates, form]);

  // Apply values from selected Non-Minier structure (converted to USD)
  const applyFromNonMiningPrice = (structureId: string) => {
    const structure = priceStructures.find((s) => s.id === structureId);
    if (!structure) return;
    const rate = structure.exchangeRate?.rate || 0;
    const toUSD = (cdf?: number | null) => (typeof cdf === "number" && rate > 0 ? cdf / rate : 0);

    // Douanes
    form.setValue("customs.customsDutyUSD", toUSD(structure.fiscality?.customsDuty), { shouldDirty: true });
    form.setValue("customs.importVATUSD", toUSD(structure.fiscality?.importVAT), { shouldDirty: true });
    form.setValue("customs.internalVATUSD", toUSD(structure.fiscality?.netVAT), { shouldDirty: true });
    form.setValue("customs.consumptionDutyUSD", toUSD(structure.fiscality?.consumptionDuty), { shouldDirty: true });

    // Redevances
    form.setValue("levies.roadFundFonerUSD", toUSD(structure.parafiscality?.foner), { shouldDirty: true });

    // Stock de sécurité total EST+SUD
    const totalStockCDF = (structure.securityStock?.estStock || 0) + (structure.securityStock?.sudStock || 0);
    form.setValue("levies.stockSecuritySudUSD", toUSD(totalStockCDF), { shouldDirty: true });

    toast({ title: "Valeurs appliquées", description: "Valeurs converties en USD depuis la structure non-minier" });
  };

  // ===== Dynamic auto-calculations (mirror create form) =====
  const watchPlatts = form.watch("base.plattsFOBUSD") || 0;
  const watchTruck = form.watch("base.truckTransportUSD") || 0;
  const watchAgency = form.watch("base.agencyCustomsUSD") || 0;

  const watchStorage = form.watch("supplier.storageHospitalityUSD") || 0;
  const watchAnr = form.watch("supplier.anrDechargementUSD") || 0;
  const watchSupplierMargin = form.watch("supplier.supplierMarginUSD") || 0;

  const watchCustomsDuty = form.watch("customs.customsDutyUSD") || 0;
  const watchImportVAT = form.watch("customs.importVATUSD") || 0;
  const watchInternalVAT = form.watch("customs.internalVATUSD") || 0;
  const watchConsumptionDuty = form.watch("customs.consumptionDutyUSD") || 0;

  const watchFoner = form.watch("levies.roadFundFonerUSD") || 0;
  const watchStock = form.watch("levies.stockSecuritySudUSD") || 0;
  const watchReconstruction = form.watch("levies.reconstructionEffortUSD") || 0;
  const watchIntervention = form.watch("levies.economicInterventionUSD") || 0;

  const watchFreight = form.watch("additionalTransport.freightToMineUSD") || 0;
  const watchLosses = form.watch("additionalTransport.lossesUSD") || 0;

  // brut CF & acquisition
  const brutCF = Number(watchPlatts || 0) + Number(watchTruck || 0);
  const acquisition = brutCF + Number(watchAgency || 0);
  // DDU
  const ddu = acquisition + Number(watchStorage || 0) + Number(watchAnr || 0) + Number(watchSupplierMargin || 0);
  // Customs subtotal (align with create form)
  const customsSubtotal = Number(watchCustomsDuty || 0) + Number(watchImportVAT || 0) + Number(watchInternalVAT || 0) + Number(watchConsumptionDuty || 0);
  // Levies total
  const leviesTotal = [watchFoner, watchStock, watchReconstruction, watchIntervention]
    .map((n) => Number(n || 0))
    .reduce((a, b) => a + b, 0);
  // Transport total
  const transportTotal = Number(watchFreight || 0) + Number(watchLosses || 0);
  // DDP
  const ddp = Number(ddu || 0) + Number(customsSubtotal || 0) + Number(leviesTotal || 0) + Number(transportTotal || 0);

  // Push back computed values
  // base
  React.useEffect(() => {
    form.setValue("base.brutCFUSD", brutCF, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
    form.setValue("base.acquisitionCostUSD", acquisition, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [brutCF, acquisition, form]);

  // supplier
  React.useEffect(() => {
    form.setValue("supplier.sellingPriceDDUUSD", ddu, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
    form.setValue("finalPricing.dduPriceUSD", ddu, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [ddu, form]);

  // customs
  React.useEffect(() => {
    form.setValue("customs.subtotalUSD", customsSubtotal, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [customsSubtotal, form]);

  // levies
  React.useEffect(() => {
    form.setValue("levies.totalLeviesUSD", leviesTotal, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [leviesTotal, form]);

  // transport total
  React.useEffect(() => {
    form.setValue("additionalTransport.totalTransportUSD", transportTotal, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [transportTotal, form]);

  // ddp
  React.useEffect(() => {
    form.setValue("finalPricing.ddpPriceUSD", ddp, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [ddp, form]);

  const onSubmit: SubmitHandler<NonMiningBuilderEditFormData> = async (data) => {
    setIsLoading(true);
    try {
      await updateNonMiningBuilder(data);

      toast({ title: "Succès", description: "Cost build up modifié avec succès" });
      router.push("/dashboard/non-mining-builders");
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      toast({ 
        title: "Erreur", 
        description: "Erreur lors de la modification du cost build up", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Générales</CardTitle>
          <CardDescription>
            Modifiez les informations de base du cost build up
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="Ex: Cost Build Up Diesel Non-Minier"
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unité de prix</Label>
              <Select
                value={form.watch("unit")}
                onValueChange={(value) => form.setValue("unit", value as "USD_M3" | "USD_LITRE")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une unité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD_M3">USD/M³</SelectItem>
                  <SelectItem value="USD_LITRE">USD/Litre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Description du cost build up..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nonMiningPriceStructureId">Structure Non-Minier (optionnel)</Label>
            <Select
              value={form.watch("nonMiningPriceStructureId") || ""}
              onValueChange={(value) => {
                form.setValue("nonMiningPriceStructureId", value || undefined);
                if (value) applyFromNonMiningPrice(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une structure non-minier" />
              </SelectTrigger>
              <SelectContent>
                {priceStructures.map((structure) => (
                  <SelectItem key={structure.id} value={structure.id}>
                    {structure.nomStructure} (Taux: {structure.exchangeRate.rate} {structure.exchangeRate.deviseBase}/{structure.exchangeRate.deviseTarget})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Coûts de base */}
      <input type="hidden" {...form.register("userId")} />
      <Card>
        <CardHeader>
          <CardTitle>1. Coûts de Base du Produit & Transport Initial</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Platt&apos;s/FOB</Label><Input type="number" step="any" {...form.register("base.plattsFOBUSD", { valueAsNumber: true })} /></div>
          <div><Label>Transport (camion)</Label><Input type="number" step="any" {...form.register("base.truckTransportUSD", { valueAsNumber: true })} /></div>
          <div><Label>Brut C&F (auto)</Label><Input type="number" step="any" {...form.register("base.brutCFUSD", { valueAsNumber: true })} disabled /></div>
          <div><Label>Agency/Customs</Label><Input type="number" step="any" {...form.register("base.agencyCustomsUSD", { valueAsNumber: true })} /></div>
          <div><Label>Prix de revient (auto)</Label><Input type="number" step="any" {...form.register("base.acquisitionCostUSD", { valueAsNumber: true })} disabled /></div>
        </CardContent>
      </Card>

      {/* Fournisseur DDU */}
      <Card>
        <CardHeader>
          <CardTitle>2. Coûts & Marge Fournisseur (DDU)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Stockage/Hospitalité</Label><Input type="number" step="any" {...form.register("supplier.storageHospitalityUSD", { valueAsNumber: true })} /></div>
          <div><Label>ANR-Déchargement</Label><Input type="number" step="any" {...form.register("supplier.anrDechargementUSD", { valueAsNumber: true })} /></div>
          <div><Label>Marge fournisseur</Label><Input type="number" step="any" {...form.register("supplier.supplierMarginUSD", { valueAsNumber: true })} /></div>
          <div><Label>Frais d&apos;Escorte (USD)</Label><Input type="number" step="any" {...form.register("supplier.escortFeesUSD", { valueAsNumber: true })} /></div>
          <div><Label>Intérêts Ligne Banque (USD)</Label><Input type="number" step="any" {...form.register("supplier.bankInterestUSD", { valueAsNumber: true })} /></div>
          <div><Label>Prix DDU (auto)</Label><Input type="number" step="any" {...form.register("supplier.sellingPriceDDUUSD", { valueAsNumber: true })} disabled /></div>
        </CardContent>
      </Card>

      {/* Douanes */}
      <Card>
        <CardHeader>
          <CardTitle>3. Douanes</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Droits de douane</Label><Input type="number" step="any" {...form.register("customs.customsDutyUSD", { valueAsNumber: true })} /></div>
          <div><Label>TVA import</Label><Input type="number" step="any" {...form.register("customs.importVATUSD", { valueAsNumber: true })} /></div>
          <div><Label>TVA nette à l’intérieur</Label><Input type="number" step="any" {...form.register("customs.internalVATUSD", { valueAsNumber: true })} /></div>
          <div><Label>Droit de consommation</Label><Input type="number" step="any" {...form.register("customs.consumptionDutyUSD", { valueAsNumber: true })} /></div>
          <div><Label>Sous-total (auto)</Label><Input type="number" step="any" {...form.register("customs.subtotalUSD", { valueAsNumber: true })} disabled /></div>
        </CardContent>
        <div className="px-6 pb-6 -mt-4 text-xs text-muted-foreground">
          Droit de douane: {Number(watchCustomsDuty || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
          {" + "} TVA Import: {Number(watchImportVAT || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
          {" + "} TVA nette à l’intérieur: {Number(watchInternalVAT || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
          {" + "} Droit de consommation: {Number(watchConsumptionDuty || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
        </div>
      </Card>

      {/* Redevances */}
      <Card>
        <CardHeader>
          <CardTitle>4. Redevances (Levies)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>FONER</Label><Input type="number" step="any" {...form.register("levies.roadFundFonerUSD", { valueAsNumber: true })} /></div>
          <div><Label>Stock Séc./Moléculaire</Label><Input type="number" step="any" {...form.register("levies.stockSecuritySudUSD", { valueAsNumber: true })} /></div>
          <div><Label>Reconstruction & Stratégique</Label><Input type="number" step="any" {...form.register("levies.reconstructionEffortUSD", { valueAsNumber: true })} /></div>
          <div><Label>Intervention Éco. & Autres</Label><Input type="number" step="any" {...form.register("levies.economicInterventionUSD", { valueAsNumber: true })} /></div>
          <div><Label>Total Redevances (auto)</Label><Input type="number" step="any" {...form.register("levies.totalLeviesUSD", { valueAsNumber: true })} disabled /></div>
        </CardContent>
      </Card>

      {/* Transport additionnel */}
      <Card>
        <CardHeader>
          <CardTitle>5. Transport Additionnel</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Freight to Mine</Label>
            <Select
              value={selectedTransportRateId}
              onValueChange={(id) => {
                setSelectedTransportRateId(id);
                const rate = transportRates.find((t) => t.id === id)?.rateUsdPerCbm ?? 0;
                form.setValue("additionalTransport.freightToMineUSD", Number(rate), { shouldDirty: true });
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sélectionner un tarif" />
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
          <div><Label>Pertes (L/camion)</Label><Input type="number" step="any" {...form.register("additionalTransport.lossesUSD", { valueAsNumber: true })} /></div>
          <div><Label>Total transport final (auto)</Label><Input type="number" step="any" {...form.register("additionalTransport.totalTransportUSD", { valueAsNumber: true })} disabled /></div>
        </CardContent>
      </Card>

      {/* Totaux */}
      <Card>
        <CardHeader>
          <CardTitle>6. Totaux</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Prix DDU (auto)</Label><Input type="number" step="any" {...form.register("finalPricing.dduPriceUSD", { valueAsNumber: true })} disabled /></div>
          <div><Label>Prix DDP (auto)</Label><Input type="number" step="any" {...form.register("finalPricing.ddpPriceUSD", { valueAsNumber: true })} disabled /></div>
        </CardContent>
      </Card>

      {/* Impression */}
      <Card>
        <CardHeader>
          <CardTitle>Impression</CardTitle>
          <CardDescription>Imprimer un récapitulatif du Cost Build Up</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button type="button" onClick={() => window.print()}>Imprimer</Button>
          </div>
          <style jsx global>{`
            @media print {
              body { background: #fff !important; }
              body * { visibility: hidden !important; }
              #builder-print, #builder-print * { visibility: visible !important; }
              #builder-print { position: absolute; left: 0; top: 0; width: 100%; padding: 16mm; }
            }
          `}</style>
          <div id="builder-print" className="hidden print:block text-[12px] leading-tight">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold text-[18px]">AAGS Petrole et Gaz</div>
                <div className="mt-2 text-[11px] text-neutral-600">Cost Build Up Non-Minier</div>
              </div>
              <div className="text-right text-[11px] text-neutral-600">
                <div>Imprimé le {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</div>
                <div>Utilisateur: {session?.user?.name || ""}</div>
              </div>
            </div>
            <div className="mt-4 text-[13px] font-semibold">{form.getValues("title")}</div>
            <div className="mt-2 grid grid-cols-1 gap-1 text-[12px]">
              <div>Unité: {form.getValues("unit")}</div>
              <div>Description: {form.getValues("description") || "—"}</div>
            </div>
            <div className="mt-6">
              <table className="w-full text-[12px]">
                <tbody>
                  <tr><td className="py-1 pr-4">Prix DDU</td><td className="text-right font-medium">{Number(ddu).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} USD</td></tr>
                  <tr><td className="py-1 pr-4">Douanes</td><td className="text-right">{Number(customsSubtotal).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} USD</td></tr>
                  <tr><td className="py-1 pr-4 pl-4 text-neutral-600">Droit de douane</td><td className="text-right text-neutral-600">{Number(watchCustomsDuty).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td></tr>
                  <tr><td className="py-1 pr-4 pl-4 text-neutral-600">TVA import</td><td className="text-right text-neutral-600">{Number(watchImportVAT).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td></tr>
                  <tr><td className="py-1 pr-4 pl-4 text-neutral-600">TVA nette à l’intérieur</td><td className="text-right text-neutral-600">{Number(watchInternalVAT).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td></tr>
                  <tr><td className="py-1 pr-4 pl-4 text-neutral-600">Droit de consommation</td><td className="text-right text-neutral-600">{Number(watchConsumptionDuty).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td></tr>
                  <tr><td className="py-1 pr-4">Redevances</td><td className="text-right">{Number(leviesTotal).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} USD</td></tr>
                  <tr><td className="py-1 pr-4">Transport additionnel</td><td className="text-right">{Number(transportTotal).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} USD</td></tr>
                  <tr><td className="py-2 pr-4 font-semibold">Prix DDP</td><td className="text-right font-semibold">{Number(ddp).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} USD</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Modification..." : "Modifier le Cost Build Up"}
        </Button>
      </div>
    </form>
  );
}
