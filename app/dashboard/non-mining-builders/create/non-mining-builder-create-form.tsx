"use client";

import { useEffect, useState } from "react";
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
import { createNonMiningBuilder } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { authClient } from "@/lib/auth-client";

const NonMiningBuilderCreateSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  unit: z.enum(["USD_M3", "USD_LITRE"]),
  nonMiningPriceStructureId: z.string().optional(),
  
  // Options
  useLocalPrice: z.boolean().default(false),
  localAcquisitionCostUSD: z.number().min(0).default(0),

  // Coûts de base
  plattsFOBUSD: z.number().min(0).default(0),
  truckTransportUSD: z.number().min(0).default(0),
  agencyCustomsUSD: z.number().min(0).default(0),
  
  // Coûts fournisseur DDU
  storageHospitalityUSD: z.number().min(0).default(0),
  anrDechargementUSD: z.number().min(0).default(0),
  supplierMarginUSD: z.number().min(40, "La marge ne doit pas être inférieure à 40").default(40),
  
  // Douanes
  customsDutyUSD: z.number().min(0).default(0),
  importVATUSD: z.number().min(0).default(0),
  internalVATUSD: z.number().min(0).default(0),
  consumptionDutyUSD: z.number().default(0),
  
  // Redevances
  roadFundFonerUSD: z.number().min(0).default(0),
  stockSecuritySudUSD: z.number().min(0).default(0),
  reconstructionEffortUSD: z.number().min(0).default(0),
  economicInterventionUSD: z.number().min(0).default(0),
  
  // Transport additionnel
  freightToMineUSD: z.number().min(0).default(0),
  lossesUSD: z.number().min(0).default(0),
});

type NonMiningBuilderCreateFormData = z.infer<typeof NonMiningBuilderCreateSchema>;

interface NonMiningBuilderCreateFormProps {
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
  miningPriceRefs?: Array<any>;
}

export function NonMiningBuilderCreateForm({ priceStructures }: NonMiningBuilderCreateFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { data: session } = authClient.useSession();
  const [transportRates, setTransportRates] = useState<Array<{ id: string; destination: string; rateUsdPerCbm: number }>>([]);

  const form = useForm({
    resolver: zodResolver(NonMiningBuilderCreateSchema),
    defaultValues: {
      unit: "USD_M3",
      useLocalPrice: false,
      localAcquisitionCostUSD: 0,
      plattsFOBUSD: 0,
      truckTransportUSD: 0,
      agencyCustomsUSD: 0,
      storageHospitalityUSD: 0,
      anrDechargementUSD: 0,
      supplierMarginUSD: 0,
      customsDutyUSD: 0,
      importVATUSD: 0,
      internalVATUSD: 0,
      consumptionDutyUSD: 0,
      roadFundFonerUSD: 0,
      stockSecuritySudUSD: 0,
      reconstructionEffortUSD: 0,
      economicInterventionUSD: 0,
      freightToMineUSD: 0,
      lossesUSD: 0,
    },
  });

  // Fonction pour appliquer les valeurs de la structure non-minier sélectionnée (converties en USD)
  const applyFromNonMiningPrice = (structureId: string) => {
    const structure = priceStructures.find((s) => s.id === structureId);
    if (!structure) return;
    const rate = structure.exchangeRate?.rate || 0;
    const toUSD = (cdf?: number | null) => (typeof cdf === "number" && rate > 0 ? cdf / rate : 0);

    // Douanes (convertir CDF -> USD)
    form.setValue("customsDutyUSD", toUSD(structure.fiscality?.customsDuty));
    form.setValue("importVATUSD", toUSD(structure.fiscality?.importVAT));
    form.setValue("internalVATUSD", toUSD(structure.fiscality?.netVAT));
    form.setValue("consumptionDutyUSD", toUSD(structure.fiscality?.consumptionDuty));

    // Redevances (convertir CDF -> USD)
    form.setValue("roadFundFonerUSD", toUSD(structure.parafiscality?.foner));

    // Stock de sécurité total (EST+SUD) converti en USD
    const totalStockCDF = (structure.securityStock?.estStock || 0) + (structure.securityStock?.sudStock || 0);
    form.setValue("stockSecuritySudUSD", toUSD(totalStockCDF));

    toast({
      title: "Valeurs appliquées",
      description: "Valeurs converties en USD depuis la structure non-minier",
    });
  };

  // Calculer les totaux en temps réel
  const watchedValues = form.watch();

  // Coûts de base
  const platts = watchedValues.useLocalPrice ? 0 : (watchedValues.plattsFOBUSD || 0);
  const transportTruck = watchedValues.useLocalPrice ? 0 : (watchedValues.truckTransportUSD || 0);
  const agency = watchedValues.useLocalPrice ? 0 : (watchedValues.agencyCustomsUSD || 0);
  const brutCFUSD = (platts || 0) + (transportTruck || 0);
  const acquisitionCostUSD = watchedValues.useLocalPrice
    ? (watchedValues.localAcquisitionCostUSD || 0)
    : (brutCFUSD + (watchedValues.agencyCustomsUSD || 0));

  useEffect(() => {
    // Load transport rates once
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

  // Prix DDU
  const dduPriceUSD = acquisitionCostUSD + 
    (watchedValues.storageHospitalityUSD || 0) + 
    (watchedValues.anrDechargementUSD || 0) + 
    (watchedValues.supplierMarginUSD || 0);

  // Douanes
  const customsTotalUSD = (watchedValues.customsDutyUSD || 0) + 
    (watchedValues.importVATUSD || 0) + 
    (watchedValues.internalVATUSD || 0) + 
    (watchedValues.consumptionDutyUSD || 0);

  // Redevances
  const leviesTotalUSD = (watchedValues.roadFundFonerUSD || 0) + 
    (watchedValues.stockSecuritySudUSD || 0) + 
    (watchedValues.reconstructionEffortUSD || 0) + 
    (watchedValues.economicInterventionUSD || 0);

  // Transport additionnel
  const transportTotalUSD = (watchedValues.freightToMineUSD || 0) + 
    (watchedValues.lossesUSD || 0);

  // Prix DDP final
  const ddpPriceUSD = dduPriceUSD + customsTotalUSD + leviesTotalUSD + transportTotalUSD;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const onSubmit = async (data: NonMiningBuilderCreateFormData) => {
    setIsLoading(true);
    try {
      if (!session?.user?.id) {
        throw new Error("Utilisateur non connecté");
      }

      await createNonMiningBuilder({
        title: data.title,
        description: data.description,
        unit: data.unit,
        userId: session.user.id,
        nonMiningPriceStructureId: data.nonMiningPriceStructureId,
        
        base: {
          plattsFOBUSD: data.plattsFOBUSD,
          truckTransportUSD: data.truckTransportUSD,
          brutCFUSD,
          agencyCustomsUSD: data.agencyCustomsUSD,
          acquisitionCostUSD,
        },
        
        supplier: {
          storageHospitalityUSD: data.storageHospitalityUSD,
          anrDechargementUSD: data.anrDechargementUSD,
          supplierMarginUSD: data.supplierMarginUSD,
          sellingPriceDDUUSD: dduPriceUSD,
        },
        
        customs: {
          customsDutyUSD: data.customsDutyUSD,
          importVATUSD: data.importVATUSD,
          subtotalUSD: customsTotalUSD,
        },
        
        levies: {
          roadFundFonerUSD: data.roadFundFonerUSD,
          stockSecuritySudUSD: data.stockSecuritySudUSD,
          reconstructionEffortUSD: data.reconstructionEffortUSD,
          economicInterventionUSD: data.economicInterventionUSD,
          totalLeviesUSD: leviesTotalUSD,
        },
        
        additionalTransport: {
          freightToMineUSD: data.freightToMineUSD,
          lossesUSD: data.lossesUSD,
          totalTransportUSD: transportTotalUSD,
        },
        
        finalPricing: {
          dduPriceUSD,
          ddpPriceUSD,
        },
      });

      toast({ title: "Succès", description: "Cost build up créé avec succès" });
      router.push("/dashboard/non-mining-builders");
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      toast({ 
        title: "Erreur", 
        description: "Erreur lors de la création du cost build up", 
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
            Définissez les informations de base du cost build up
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input id="useLocalPrice" type="checkbox" {...form.register("useLocalPrice")} />
              <Label htmlFor="useLocalPrice">Saisir directement le prix de revient (local)</Label>
            </div>
            {form.watch("useLocalPrice") && (
              <div className="space-y-2">
                <Label htmlFor="localAcquisitionCostUSD">Prix de revient (USD)</Label>
                <Input
                  id="localAcquisitionCostUSD"
                  type="number"
                  step="any"
                  {...form.register("localAcquisitionCostUSD", { valueAsNumber: true })}
                  placeholder="0.00"
                />
              </div>
            )}
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
              onValueChange={(value) => {
                form.setValue("nonMiningPriceStructureId", value || undefined);
                if (value) {
                  applyFromNonMiningPrice(value);
                }
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
            <p className="text-xs text-muted-foreground">
              Les valeurs des douanes, TVA, FONER et stock de sécurité seront automatiquement remplies
            </p>
          </div>
          
        </CardContent>
      </Card>

      {/* Coûts de base */}
      <Card>
        <CardHeader>
          <CardTitle>1. Coûts de Base du Produit & Transport Initial</CardTitle>
          <CardDescription>
            Coûts fondamentaux du produit et du transport initial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plattsFOBUSD">Platt's or FOB (USD)</Label>
              <Input
                id="plattsFOBUSD"
                type="number"
                step="any"
                {...form.register("plattsFOBUSD", { valueAsNumber: true })}
                placeholder="0.00"
                disabled={form.watch("useLocalPrice")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="truckTransportUSD">Transport (camion) (USD)</Label>
              <Input
                id="truckTransportUSD"
                type="number"
                step="any"
                {...form.register("truckTransportUSD", { valueAsNumber: true })}
                placeholder="0.00"
                disabled={form.watch("useLocalPrice")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agencyCustomsUSD">Agency/Trade Sce/Customs (USD)</Label>
              <Input
                id="agencyCustomsUSD"
                type="number"
                step="any"
                {...form.register("agencyCustomsUSD", { valueAsNumber: true })}
                placeholder="0.00"
                disabled={form.watch("useLocalPrice")}
              />
            </div>
          </div>
          
          {/* Calculs automatiques */}
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Brut C&F:</span>
              <span className="font-medium">{formatCurrency(brutCFUSD)}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Prix de revient (Coût d'acquisition):</span>
              <span>{formatCurrency(acquisitionCostUSD)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coûts fournisseur DDU */}
      <Card>
        <CardHeader>
          <CardTitle>2. Coûts et Marge du Fournisseur pour l'Offre DDU</CardTitle>
          <CardDescription>
            Coûts supplémentaires du fournisseur pour la livraison DDU
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storageHospitalityUSD">Frais stockage/hospitality (USD)</Label>
              <Input
                id="storageHospitalityUSD"
                type="number"
                step="any"
                {...form.register("storageHospitalityUSD", { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="anrDechargementUSD">ANR-Déchargement-OCC-Hydrocarbures (USD)</Label>
              <Input
                id="anrDechargementUSD"
                type="number"
                step="any"
                {...form.register("anrDechargementUSD", { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierMarginUSD">Marge du Fournisseur (USD)</Label>
              <Input
                id="supplierMarginUSD"
                type="number"
                step="any"
                {...form.register("supplierMarginUSD", { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between font-semibold text-lg">
              <span>Prix de vente DDU (Delivered Duty Unpaid):</span>
              <span>{formatCurrency(dduPriceUSD)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Douanes */}
      <Card>
        <CardHeader>
          <CardTitle>3. Coûts Collectés par la Douane</CardTitle>
          <CardDescription>
            Droits de douane et taxes gouvernementales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customsDutyUSD" className="flex items-center gap-2">
                CUSTOMS DUTIES / Droit de douane (USD)
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Auto-rempli</span>
              </Label>
              <Input
                id="customsDutyUSD"
                type="number"
                step="any"
                {...form.register("customsDutyUSD", { valueAsNumber: true })}
                placeholder="0.00"
                className="bg-blue-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="importVATUSD" className="flex items-center gap-2">
                VAT import (USD)
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Auto-rempli</span>
              </Label>
              <Input
                id="importVATUSD"
                type="number"
                step="any"
                {...form.register("importVATUSD", { valueAsNumber: true })}
                placeholder="0.00"
                className="bg-blue-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="internalVATUSD" className="flex items-center gap-2">
                VAT interne (USD)
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Auto-rempli</span>
              </Label>
              <Input
                id="internalVATUSD"
                type="number"
                step="any"
                {...form.register("internalVATUSD", { valueAsNumber: true })}
                placeholder="0.00"
                className="bg-blue-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consumptionDutyUSD" className="flex items-center gap-2">
                Droit de consommation (USD)
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Auto-rempli</span>
              </Label>
              <Input
                id="consumptionDutyUSD"
                type="number"
                step="any"
                {...form.register("consumptionDutyUSD", { valueAsNumber: true })}
                placeholder="0.00"
                className="bg-blue-50"
              />
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total Droits Douaniers & TVA:</span>
              <span>{formatCurrency(customsTotalUSD)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Redevances */}
      <Card>
        <CardHeader>
          <CardTitle>4. Redevances (Levies)</CardTitle>
          <CardDescription>
            Redevances collectées par la douane
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roadFundFonerUSD" className="flex items-center gap-2">
                ROAD FUND (FONER) (USD)
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Auto-rempli</span>
              </Label>
              <Input
                id="roadFundFonerUSD"
                type="number"
                step="any"
                {...form.register("roadFundFonerUSD", { valueAsNumber: true })}
                placeholder="0.00"
                className="bg-blue-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stockSecuritySudUSD" className="flex items-center gap-2">
                Stock de sécur SUD / Marquage moléculaire (USD)
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Auto-rempli</span>
              </Label>
              <Input
                id="stockSecuritySudUSD"
                type="number"
                step="any"
                {...form.register("stockSecuritySudUSD", { valueAsNumber: true })}
                placeholder="0.00"
                className="bg-blue-50"
              />
              <p className="text-xs text-muted-foreground">
                Calculé automatiquement : estStock + sudStock de la structure sélectionnée
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reconstructionEffortUSD">Effort de reconstruction & Stock Stratégique (USD)</Label>
              <Input
                id="reconstructionEffortUSD"
                type="number"
                step="any"
                {...form.register("reconstructionEffortUSD", { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="economicInterventionUSD">Intervention Économique & Autres (USD)</Label>
              <Input
                id="economicInterventionUSD"
                type="number"
                step="any"
                {...form.register("economicInterventionUSD", { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total Redevances (Levies) Collectées par la Douane:</span>
              <span>{formatCurrency(leviesTotalUSD)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transport additionnel */}
      <Card>
        <CardHeader>
          <CardTitle>5. Coûts de Transport Additionnels</CardTitle>
          <CardDescription>
            Transport final vers la mine
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="freightToMineUSD">Freight to Mine from L'shi (USD)</Label>
              <Select
                value={String(form.watch("freightToMineUSD") || "")}
                onValueChange={(v) => form.setValue("freightToMineUSD", Number(v) as any)}
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
            <div className="space-y-2">
              <Label htmlFor="lossesUSD">Pertes (300 litres/camion) (USD)</Label>
              <Input
                id="lossesUSD"
                type="number"
                step="any"
                {...form.register("lossesUSD", { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total Frais de transport finaux:</span>
              <span>{formatCurrency(transportTotalUSD)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prix final */}
      <Card>
        <CardHeader>
          <CardTitle>Prix de Vente Final</CardTitle>
          <CardDescription>
            Calcul automatique du prix DDP final
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center p-6 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border-2 border-green-200 dark:border-green-800">
            <p className="text-sm text-muted-foreground mb-2">Prix de vente DDP (Delivered Duty Paid)</p>
            <p className="text-4xl font-bold text-green-600">
              {formatCurrency(ddpPriceUSD)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              DDU: {formatCurrency(dduPriceUSD)} + Douanes: {formatCurrency(customsTotalUSD)} + Redevances: {formatCurrency(leviesTotalUSD)} + Transport: {formatCurrency(transportTotalUSD)}
            </p>
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
          {isLoading ? "Création..." : "Créer le Cost Build Up"}
        </Button>
      </div>
    </form>
  );
}
