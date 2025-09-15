"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
  sellingPriceDDUUSD: z.number().optional(),
}).partial();

const CustomsSchema = z.object({
  customsDutyUSD: z.number().optional(),
  importVATUSD: z.number().optional(),
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
    baseCosts?: any;
    supplierDDU?: any;
    customs?: any;
    levies?: any;
    transport?: any;
    totals?: any;
  };
  priceStructures: Array<{
    id: string;
    nomStructure: string;
    exchangeRate: {
      rate: number;
      deviseBase: string;
      deviseTarget: string;
    };
  }>;
}

export function NonMiningBuilderEditForm({ builder, priceStructures }: NonMiningBuilderEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { data: session } = authClient.useSession();

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
        plattsFOBUSD: builder.baseCosts.plattsFOBUSD,
        truckTransportUSD: builder.baseCosts.truckTransportUSD,
        brutCFUSD: builder.baseCosts.brutCFUSD,
        agencyCustomsUSD: builder.baseCosts.agencyCustomsUSD,
        acquisitionCostUSD: builder.baseCosts.acquisitionCostUSD,
      } : undefined,
      supplier: builder.supplierDDU ? {
        storageHospitalityUSD: builder.supplierDDU.storageHospitalityUSD,
        anrDechargementUSD: builder.supplierDDU.anrDechargementUSD,
        supplierMarginUSD: builder.supplierDDU.supplierMarginUSD,
        sellingPriceDDUUSD: builder.supplierDDU.sellingPriceDDUUSD,
      } : undefined,
      customs: builder.customs ? {
        customsDutyUSD: builder.customs.customsDutyUSD,
        importVATUSD: builder.customs.importVATUSD,
        subtotalUSD: builder.customs.subtotalUSD,
      } : undefined,
      levies: builder.levies ? {
        roadFundFonerUSD: builder.levies.fonerUSD,
        stockSecuritySudUSD: builder.levies.molecularMarkingOrStockUSD,
        reconstructionEffortUSD: builder.levies.reconstructionStrategicUSD,
        economicInterventionUSD: builder.levies.economicInterventionUSD,
        totalLeviesUSD: builder.levies.totalLeviesUSD,
      } : undefined,
      additionalTransport: builder.transport ? {
        freightToMineUSD: builder.transport.freightToMineUSD,
        lossesUSD: builder.transport.lossesLitresPerTruck,
        totalTransportUSD: builder.transport.totalTransportFinalUSD,
      } : undefined,
      finalPricing: builder.totals ? {
        dduPriceUSD: builder.totals.priceDDUUSD,
        ddpPriceUSD: builder.totals.priceDDPUSD,
      } : undefined,
    },
  });

  React.useEffect(() => {
    if (session?.user?.id) {
      form.setValue("userId", session.user.id, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
    }
  }, [session?.user?.id]);

  // ===== Dynamic auto-calculations (mirror create form) =====
  const watchPlatts = form.watch("base.plattsFOBUSD") || 0;
  const watchTruck = form.watch("base.truckTransportUSD") || 0;
  const watchAgency = form.watch("base.agencyCustomsUSD") || 0;

  const watchStorage = form.watch("supplier.storageHospitalityUSD") || 0;
  const watchAnr = form.watch("supplier.anrDechargementUSD") || 0;
  const watchSupplierMargin = form.watch("supplier.supplierMarginUSD") || 0;

  const watchCustomsDuty = form.watch("customs.customsDutyUSD") || 0;
  const watchImportVAT = form.watch("customs.importVATUSD") || 0;

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
  // Customs subtotal
  const customsSubtotal = Number(watchCustomsDuty || 0) + Number(watchImportVAT || 0);
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
    form.setValue("base.brutCFUSD", brutCF as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
    form.setValue("base.acquisitionCostUSD", acquisition as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [brutCF, acquisition]);

  // supplier
  React.useEffect(() => {
    form.setValue("supplier.sellingPriceDDUUSD", ddu as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
    form.setValue("finalPricing.dduPriceUSD", ddu as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [ddu]);

  // customs
  React.useEffect(() => {
    form.setValue("customs.subtotalUSD", customsSubtotal as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [customsSubtotal]);

  // levies
  React.useEffect(() => {
    form.setValue("levies.totalLeviesUSD", leviesTotal as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [leviesTotal]);

  // transport total
  React.useEffect(() => {
    form.setValue("additionalTransport.totalTransportUSD", transportTotal as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [transportTotal]);

  // ddp
  React.useEffect(() => {
    form.setValue("finalPricing.ddpPriceUSD", ddp as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
  }, [ddp]);

  const onSubmit = async (data: NonMiningBuilderEditFormData) => {
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
                onValueChange={(value) => form.setValue("unit", value as any)}
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
              onValueChange={(value) => form.setValue("nonMiningPriceStructureId", value || undefined)}
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
          <div><Label>Platt's/FOB</Label><Input type="number" step="any" {...form.register("base.plattsFOBUSD", { valueAsNumber: true })} /></div>
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
          <div><Label>Sous-total (auto)</Label><Input type="number" step="any" {...form.register("customs.subtotalUSD", { valueAsNumber: true })} disabled /></div>
        </CardContent>
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
          <div><Label>Freight to Mine</Label><Input type="number" step="any" {...form.register("additionalTransport.freightToMineUSD", { valueAsNumber: true })} /></div>
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
