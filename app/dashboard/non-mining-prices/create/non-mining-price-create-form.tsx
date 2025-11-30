"use client";

import { useState } from "react";
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
import { createNonMiningPriceStructure } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { authClient } from "@/lib/auth-client";

const NonMiningPriceCreateSchema = z.object({
  nomStructure: z.string().min(1, "Le nom de la structure est requis"),
  description: z.string().optional(),
  cardinale: z.enum(["SUD", "NORD", "EST", "OUEST"]),
  pmfCommercialCDF: z.number().min(0, "Le PMF commercial doit être positif"),
  rate: z.number().min(0.001, "Le taux de change doit être positif"),
  // Frais de distribution
  ogefrem: z.number().min(0),
  socirFees: z.number().min(0),
  sepSecurityCharges: z.number().min(0),
  additionalCapacitySPSA: z.number().min(0),
  lerexcomPetroleum: z.number().min(0),
  socComCharges: z.number().min(0),
  socComMargin: z.number().min(0),
  // Stock de sécurité (unique)
  securityStock: z.number().min(0),
  // Parafiscalité
  foner: z.number().min(0),
  pmfFiscal: z.number(),
  // Fiscalité
  venteVAT: z.number().min(0),
  customsDuty: z.number().min(0),
  consumptionDuty: z.number(),
  importVAT: z.number().min(0),
  netVAT: z.number().min(0),
});

type NonMiningPriceCreateFormData = z.infer<typeof NonMiningPriceCreateSchema>;

interface NonMiningPriceCreateFormProps {
  exchangeRates: Array<{
    id: string;
    rate: number;
    deviseBase: string;
    deviseTarget: string;
    validOn: Date;
  }>;
}

export function NonMiningPriceCreateForm({ exchangeRates }: NonMiningPriceCreateFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { data: session } = authClient.useSession();

  const form = useForm<NonMiningPriceCreateFormData>({
    resolver: zodResolver(NonMiningPriceCreateSchema),
    defaultValues: {
      cardinale: "SUD",
      pmfCommercialCDF: 0,
      rate: exchangeRates[0]?.rate || 0,
      ogefrem: 0,
      socirFees: 0,
      sepSecurityCharges: 0,
      additionalCapacitySPSA: 0,
      lerexcomPetroleum: 0,
      socComCharges: 0,
      socComMargin: 0,
      securityStock: 0,
      foner: 0,
      pmfFiscal: 0,
      venteVAT: 0,
      customsDuty: 0,
      consumptionDuty: 0,
      importVAT: 0,
      netVAT: 0,
    },
  });

  // Calculer les totaux en temps réel
  const watchedValues = form.watch();
  const rate = watchedValues.rate || 2500;

  // Calculer les totaux
  const totalDistribution = 
    (watchedValues.ogefrem || 0) +
    (watchedValues.socirFees || 0) +
    (watchedValues.sepSecurityCharges || 0) +
    (watchedValues.additionalCapacitySPSA || 0) +
    (watchedValues.lerexcomPetroleum || 0) +
    (watchedValues.socComCharges || 0) +
    (watchedValues.socComMargin || 0);

  const totalSecurity = (watchedValues.securityStock || 0);

  const totalFiscality1 = 
    (watchedValues.customsDuty || 0) +
    (watchedValues.consumptionDuty || 0) +
    (watchedValues.importVAT || 0);

  const totalFiscality2 = 
    totalFiscality1 + 
    (watchedValues.netVAT || 0);

  const referencePriceCDF = 
    (watchedValues.pmfCommercialCDF || 0) + 
    totalDistribution + 
    totalSecurity + 
    (watchedValues.foner || 0) + 
    totalFiscality2;

  const referencePriceUSD = referencePriceCDF / rate;
  const appliedPriceCDF = referencePriceCDF / 1000;
  const appliedPriceUSD = appliedPriceCDF / rate;

  const formatCurrency = (amount: number, currency: string = "CDF") => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      minimumFractionDigits: currency === "USD" ? 2 : 0,
      maximumFractionDigits: currency === "USD" ? 2 : 0,
    }).format(amount);
  };

  const formatCurrencySmall = (amount: number, currency: string = "CDF") => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      minimumFractionDigits: currency === "USD" ? 4 : 2,
      maximumFractionDigits: currency === "USD" ? 4 : 2,
    }).format(amount);
  };

  const onSubmit = async (data: NonMiningPriceCreateFormData) => {
    setIsLoading(true);
    try {
      // Récupérer l'ID de l'utilisateur connecté
      if (!session?.user?.id) {
        throw new Error("Utilisateur non connecté");
      }
      const userId = session.user.id;
      
      // Calculer les prix finaux
      const totalDistribution = 
        (data.ogefrem || 0) +
        (data.socirFees || 0) +
        (data.sepSecurityCharges || 0) +
        (data.additionalCapacitySPSA || 0) +
        (data.lerexcomPetroleum || 0) +
        (data.socComCharges || 0) +
        (data.socComMargin || 0);

      const totalSecurity = (data.securityStock || 0);

      const totalFiscality1 = 
        (data.customsDuty || 0) +
        (data.consumptionDuty || 0) +
        (data.importVAT || 0);

      const totalFiscality2 = 
        totalFiscality1 + 
        (data.netVAT || 0);

      const referencePriceCDF = 
        (data.pmfCommercialCDF || 0) + 
        totalDistribution + 
        totalSecurity + 
        (data.foner || 0) + 
        totalFiscality2;

      const referencePriceUSD = referencePriceCDF / data.rate;
      const appliedPriceCDF = referencePriceCDF / 1000;
      const appliedPriceUSD = appliedPriceCDF / data.rate;
      
      await createNonMiningPriceStructure({
        nomStructure: data.nomStructure,
        description: data.description,
        cardinale: data.cardinale,
        rate: data.rate,
        pmfCommercialUSD: data.pmfCommercialCDF / data.rate,
        pmfCommercialCDF: data.pmfCommercialCDF,
        userId,
        distributionCosts: {
          ogefrem: data.ogefrem,
          socirFees: data.socirFees,
          sepSecurityCharges: data.sepSecurityCharges,
          additionalCapacitySPSA: data.additionalCapacitySPSA,
          lerexcomPetroleum: data.lerexcomPetroleum,
          socComCharges: data.socComCharges,
          socComMargin: data.socComMargin,
        },
        securityStock: {
          estStock: data.securityStock,
          sudStock: 0,
        },
        parafiscality: {
          foner: data.foner,
          pmfFiscal: data.pmfFiscal,
        },
        fiscality: {
          venteVAT: data.venteVAT,
          customsDuty: data.customsDuty,
          consumptionDuty: data.consumptionDuty,
          importVAT: data.importVAT,
          netVAT: data.netVAT,
        },
        finalPricing: {
          referencePriceCDF,
          referencePriceUSD,
          appliedPriceCDF,
          appliedPriceUSD,
        },
      });

      toast({ title: "Succès", description: "Structure de prix créée avec succès" });
      router.push("/dashboard/non-mining-prices");
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      toast({ title: "Erreur", description: "Erreur lors de la création de la structure de prix", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form id="nonmining-price-create-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-24">
      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Générales</CardTitle>
          <CardDescription>
            Définissez les informations de base de la structure de prix
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nomStructure">Nom de la structure *</Label>
              <Input
                id="nomStructure"
                {...form.register("nomStructure")}
                placeholder="Ex: Structure Commerciale Sud"
              />
              {form.formState.errors.nomStructure && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.nomStructure.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardinale">Zone géographique</Label>
              <Select
                value={form.watch("cardinale")}
                onValueChange={(value) => form.setValue("cardinale", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUD">Sud</SelectItem>
                  <SelectItem value="NORD">Nord</SelectItem>
                  <SelectItem value="EST">Est</SelectItem>
                  <SelectItem value="OUEST">Ouest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Description de la structure de prix..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* PMF Commercial */}
      <Card>
        <CardHeader>
          <CardTitle>PMF Commercial</CardTitle>
          <CardDescription>
            Prix de Marché Forfaitaire commercial de base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pmfCommercialCDF">PMF Commercial (CDF) *</Label>
              <Input
                id="pmfCommercialCDF"
                type="number"
                step="0.01"
                {...form.register("pmfCommercialCDF", { valueAsNumber: true })}
                placeholder="0.00"
              />
              <div className="text-sm text-muted-foreground">
                Équivalent USD: {formatCurrency((watchedValues.pmfCommercialCDF || 0) / rate, "USD")}
              </div>
              {form.formState.errors.pmfCommercialCDF && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.pmfCommercialCDF.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Taux de change (CDF/USD)</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                {...form.register("rate", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {form.formState.errors.rate && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.rate.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Frais de Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Frais de Distribution</CardTitle>
          <CardDescription>
            Coûts liés à la distribution et aux services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ogefrem">Ogefrem</Label>
              <Input
                id="ogefrem"
                type="number"
                step="0.01"
                {...form.register("ogefrem", { valueAsNumber: true })}
                placeholder="0.00"
              />
              <div className="text-xs text-muted-foreground">
                USD: {formatCurrency((watchedValues.ogefrem || 0) / rate, "USD")}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="socirFees">Frais & services Socir</Label>
              <Input
                id="socirFees"
                type="number"
                step="0.01"
                {...form.register("socirFees", { valueAsNumber: true })}
                placeholder="0.00"
              />
              <div className="text-xs text-muted-foreground">
                USD: {formatCurrency((watchedValues.socirFees || 0) / rate, "USD")}
              </div>
            </div>
              <div className="space-y-2">
                <Label htmlFor="sepSecurityCharges">Charges SEP, Sécurité et Stratégie</Label>
                <Input
                  id="sepSecurityCharges"
                  type="number"
                  step="0.01"
                  {...form.register("sepSecurityCharges", { valueAsNumber: true })}
                  placeholder="0.00"
                />
                <div className="text-xs text-muted-foreground">
                  USD: {formatCurrency((watchedValues.sepSecurityCharges || 0) / rate, "USD")}
                </div>
              </div>
            <div className="space-y-2">
              <Label htmlFor="additionalCapacitySPSA">Capacités additionnelles SPSA</Label>
              <Input
                id="additionalCapacitySPSA"
                type="number"
                step="0.01"
                {...form.register("additionalCapacitySPSA", { valueAsNumber: true })}
                placeholder="0.00"
              />
              <div className="text-xs text-muted-foreground">
                USD: {formatCurrency((watchedValues.additionalCapacitySPSA || 0) / rate, "USD")}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lerexcomPetroleum">Lerexcom Petroleum</Label>
              <Input
                id="lerexcomPetroleum"
                type="number"
                step="0.01"
                {...form.register("lerexcomPetroleum", { valueAsNumber: true })}
                placeholder="0.00"
              />
              <div className="text-xs text-muted-foreground">
                USD: {formatCurrency((watchedValues.lerexcomPetroleum || 0) / rate, "USD")}
              </div>
            </div>
              <div className="space-y-2">
                <Label htmlFor="socComCharges">Charges Soc Com</Label>
                <Input
                  id="socComCharges"
                  type="number"
                  step="0.01"
                  {...form.register("socComCharges", { valueAsNumber: true })}
                  placeholder="0.00"
                />
                <div className="text-xs text-muted-foreground">
                  USD: {formatCurrency((watchedValues.socComCharges || 0) / rate, "USD")}
                </div>
              </div>
            <div className="space-y-2">
              <Label htmlFor="socComMargin">Marges Soc, Com</Label>
              <Input
                id="socComMargin"
                type="number"
                step="0.01"
                {...form.register("socComMargin", { valueAsNumber: true })}
                placeholder="0.00"
              />
              <div className="text-xs text-muted-foreground">
                USD: {formatCurrency((watchedValues.socComMargin || 0) / rate, "USD")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock de Sécurité */}
      <Card>
        <CardHeader>
          <CardTitle>Stock de Sécurité</CardTitle>
          <CardDescription>
            Stock de sécurité total (unique)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="securityStock">Stock Sécurité</Label>
              <Input
                id="securityStock"
                type="number"
                step="0.01"
                {...form.register("securityStock", { valueAsNumber: true })}
                placeholder="0.00"
              />
              <div className="text-xs text-muted-foreground">
                USD: {formatCurrency((watchedValues.securityStock || 0) / rate, "USD")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parafiscalité */}
      <Card>
        <CardHeader>
          <CardTitle>Parafiscalité</CardTitle>
          <CardDescription>
            Charges parafiscales et PMF fiscal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="foner">FONER</Label>
              <Input
                id="foner"
                type="number"
                step="0.01"
                {...form.register("foner", { valueAsNumber: true })}
                placeholder="0.00"
              />
              <div className="text-xs text-muted-foreground">
                USD: {formatCurrency((watchedValues.foner || 0) / rate, "USD")}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pmfFiscal">PMF Fiscal</Label>
              <Input
                id="pmfFiscal"
                type="number"
                step="0.01"
                {...form.register("pmfFiscal", { valueAsNumber: true })}
                placeholder="0.00"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fiscalité */}
      <Card>
        <CardHeader>
          <CardTitle>Fiscalité</CardTitle>
          <CardDescription>
            Taxes et droits de douane
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="venteVAT">TVA à la vente</Label>
              <Input
                id="venteVAT"
                type="number"
                step="0.01"
                {...form.register("venteVAT", { valueAsNumber: true })}
                placeholder="0.00"
              />
              <div className="text-xs text-muted-foreground">
                USD: {formatCurrency((watchedValues.venteVAT || 0) / rate, "USD")}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customsDuty">Droit de Douane</Label>
              <Input
                id="customsDuty"
                type="number"
                step="0.01"
                {...form.register("customsDuty", { valueAsNumber: true })}
                placeholder="0.00"
              />
              <div className="text-xs text-muted-foreground">
                USD: {formatCurrency((watchedValues.customsDuty || 0) / rate, "USD")}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="consumptionDuty">Droits de consommation</Label>
              <Input
                id="consumptionDuty"
                type="number"
                step="0.01"
                {...form.register("consumptionDuty", { valueAsNumber: true })}
                placeholder="0.00"
              />
              <div className="text-xs text-muted-foreground">
                USD: {formatCurrency((watchedValues.consumptionDuty || 0) / rate, "USD")}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="importVAT">TVA à l'importation</Label>
              <Input
                id="importVAT"
                type="number"
                step="0.01"
                {...form.register("importVAT", { valueAsNumber: true })}
                placeholder="0.00"
              />
              <div className="text-xs text-muted-foreground">
                USD: {formatCurrency((watchedValues.importVAT || 0) / rate, "USD")}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="netVAT">TVA nette à l'intérieur</Label>
              <Input
                id="netVAT"
                type="number"
                step="0.01"
                {...form.register("netVAT", { valueAsNumber: true })}
                placeholder="0.00"
              />
              <div className="text-xs text-muted-foreground">
                USD: {formatCurrency((watchedValues.netVAT || 0) / rate, "USD")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Résumé des totaux en temps réel */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé des Calculs</CardTitle>
          <CardDescription>
            Totaux calculés automatiquement en temps réel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PMF Commercial */}
          <div className="text-center p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
            <p className="text-sm text-muted-foreground mb-2">PMF Commercial</p>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(watchedValues.pmfCommercialCDF || 0)}
              </p>
              <p className="text-lg font-semibold text-muted-foreground">
                {formatCurrency((watchedValues.pmfCommercialCDF || 0) / rate, "USD")}
              </p>
            </div>
          </div>

          {/* Frais de Distribution */}
          <div className="space-y-3">
            <h4 className="font-semibold text-lg">Frais de Distribution</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Ogefrem</span>
                  <div className="text-right">
                    <div>{formatCurrency(watchedValues.ogefrem || 0)}</div>
                    <div className="text-xs text-muted-foreground">{formatCurrency((watchedValues.ogefrem || 0) / rate, "USD")}</div>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Frais & services Socir</span>
                  <div className="text-right">
                    <div>{formatCurrency(watchedValues.socirFees || 0)}</div>
                    <div className="text-xs text-muted-foreground">{formatCurrency((watchedValues.socirFees || 0) / rate, "USD")}</div>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Charges SEP, Sécurité</span>
                  <div className="text-right">
                    <div>{formatCurrency(watchedValues.sepSecurityCharges || 0)}</div>
                    <div className="text-xs text-muted-foreground">{formatCurrency((watchedValues.sepSecurityCharges || 0) / rate, "USD")}</div>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Capacités additionnelles SPSA</span>
                  <div className="text-right">
                    <div>{formatCurrency(watchedValues.additionalCapacitySPSA || 0)}</div>
                    <div className="text-xs text-muted-foreground">{formatCurrency((watchedValues.additionalCapacitySPSA || 0) / rate, "USD")}</div>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Lerexcom Petroleum</span>
                  <div className="text-right">
                    <div>{formatCurrency(watchedValues.lerexcomPetroleum || 0)}</div>
                    <div className="text-xs text-muted-foreground">{formatCurrency((watchedValues.lerexcomPetroleum || 0) / rate, "USD")}</div>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Charges Soc Com</span>
                  <div className="text-right">
                    <div>{formatCurrency(watchedValues.socComCharges || 0)}</div>
                    <div className="text-xs text-muted-foreground">{formatCurrency((watchedValues.socComCharges || 0) / rate, "USD")}</div>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Marges Soc, Com</span>
                  <div className="text-right">
                    <div>{formatCurrency(watchedValues.socComMargin || 0)}</div>
                    <div className="text-xs text-muted-foreground">{formatCurrency((watchedValues.socComMargin || 0) / rate, "USD")}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t pt-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex justify-between text-lg font-bold">
                <span>Total frais de Distribution</span>
                <div className="text-right">
                  <div className="text-primary">{formatCurrency(totalDistribution)}</div>
                  <div className="text-sm text-muted-foreground">{formatCurrency(totalDistribution / rate, "USD")}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stock de Sécurité */}
          <div className="space-y-3">
            <h4 className="font-semibold text-lg">Stock de Sécurité</h4>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Stock Sécurité</p>
              <p className="text-xl font-bold">{formatCurrency(watchedValues.securityStock || 0)}</p>
              <p className="text-sm text-muted-foreground">{formatCurrency((watchedValues.securityStock || 0) / rate, "USD")}</p>
            </div>
            <div className="border-t pt-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Stock Sécurité</span>
                <div className="text-right">
                  <div className="text-primary">{formatCurrency(totalSecurity)}</div>
                  <div className="text-sm text-muted-foreground">{formatCurrency(totalSecurity / rate, "USD")}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Parafiscalité */}
          <div className="space-y-3">
            <h4 className="font-semibold text-lg">Parafiscalité</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">FONER</p>
                <p className="text-xl font-bold">{formatCurrency(watchedValues.foner || 0)}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency((watchedValues.foner || 0) / rate, "USD")}</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">PMF Fiscal</p>
                <p className={`text-xl font-bold ${(watchedValues.pmfFiscal || 0) < 0 ? 'text-destructive' : ''}`}>
                  {formatCurrency(watchedValues.pmfFiscal || 0)}
                </p>
                <p className={`text-sm ${(watchedValues.pmfFiscal || 0) < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {formatCurrency((watchedValues.pmfFiscal || 0) / rate, "USD")}
                </p>
              </div>
            </div>
          </div>

          {/* Fiscalité */}
          <div className="space-y-3">
            <h4 className="font-semibold text-lg">Fiscalité</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>TVA à la vente</span>
                <div className="text-right">
                  <div>{formatCurrency(watchedValues.venteVAT || 0)}</div>
                  <div className="text-xs text-muted-foreground">{formatCurrency((watchedValues.venteVAT || 0) / rate, "USD")}</div>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span>Droit de Douane</span>
                <div className="text-right">
                  <div>{formatCurrency(watchedValues.customsDuty || 0)}</div>
                  <div className="text-xs text-muted-foreground">{formatCurrency((watchedValues.customsDuty || 0) / rate, "USD")}</div>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span>Droits de consommation</span>
                <div className="text-right">
                  <div className={`${(watchedValues.consumptionDuty || 0) < 0 ? 'text-destructive' : ''}`}>
                    {formatCurrency(watchedValues.consumptionDuty || 0)}
                  </div>
                  <div className={`text-xs ${(watchedValues.consumptionDuty || 0) < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {formatCurrency((watchedValues.consumptionDuty || 0) / rate, "USD")}
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span>TVA à l'importation</span>
                <div className="text-right">
                  <div>{formatCurrency(watchedValues.importVAT || 0)}</div>
                  <div className="text-xs text-muted-foreground">{formatCurrency((watchedValues.importVAT || 0) / rate, "USD")}</div>
                </div>
              </div>
            </div>
            <div className="border-t pt-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Fiscalité 1</span>
                <div className="text-right">
                  <div className="text-primary">{formatCurrency(totalFiscality1)}</div>
                  <div className="text-sm text-muted-foreground">{formatCurrency(totalFiscality1 / rate, "USD")}</div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>TVA nette à l'intérieur</span>
                <div className="text-right">
                  <div>{formatCurrency(watchedValues.netVAT || 0)}</div>
                  <div className="text-xs text-muted-foreground">{formatCurrency((watchedValues.netVAT || 0) / rate, "USD")}</div>
                </div>
              </div>
            </div>
            <div className="border-t pt-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Fiscalité 2</span>
                <div className="text-right">
                  <div className="text-primary">{formatCurrency(totalFiscality2)}</div>
                  <div className="text-sm text-muted-foreground">{formatCurrency(totalFiscality2 / rate, "USD")}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Prix finaux */}
          <div className="space-y-4">
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <p className="text-sm text-muted-foreground mb-2">Prix de référence en $/M3</p>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(referencePriceCDF)}
                </p>
                <p className="text-xl font-semibold text-muted-foreground">
                  {formatCurrency(referencePriceUSD, "USD")}
                </p>
              </div>
            </div>
            <div className="text-center p-6 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border-2 border-green-200 dark:border-green-800">
              <p className="text-sm text-muted-foreground mb-2">Prix à appliquer</p>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrencySmall(appliedPriceCDF)}
                </p>
                <p className="text-xl font-semibold text-green-600">
                  {formatCurrencySmall(appliedPriceUSD, "USD")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="hidden md:flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>Annuler</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? "Création..." : "Créer la structure"}</Button>
      </div>

      {/* Mobile sticky action bar */}
      <div className="md:hidden fixed bottom-[56px] inset-x-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-3">
        <div className="flex gap-2">
          <Button className="flex-1" type="button" variant="outline" disabled={isLoading} onClick={() => router.back()}>Retour</Button>
          <Button className="flex-1" type="button" disabled={isLoading} onClick={() => (document.getElementById("nonmining-price-create-form") as HTMLFormElement | null)?.requestSubmit()}>
            {isLoading ? "..." : "Créer"}
          </Button>
        </div>
      </div>
    </form>
  );
}
