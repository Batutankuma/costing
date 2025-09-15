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
import { updateNonMiningPriceStructure } from "../actions";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const NonMiningPriceEditSchema = z.object({
  nomStructure: z.string().min(1, "Le nom de la structure est requis"),
  description: z.string().optional(),
  cardinale: z.enum(["SUD", "NORD", "EST", "OUEST"]),
  pmfCommercialCDF: z.number().min(0, "Le PMF commercial doit être positif"),
  rate: z.number().min(0.001, "Le taux de change doit être positif").optional(),
  // Frais de distribution
  ogefrem: z.number().min(0).default(0),
  socirFees: z.number().min(0).default(0),
  sepSecurityCharges: z.number().min(0).default(0),
  additionalCapacitySPSA: z.number().min(0).default(0),
  lerexcomPetroleum: z.number().min(0).default(0),
  socComCharges: z.number().min(0).default(0),
  socComMargin: z.number().min(0).default(0),
  // Stock de sécurité (unique)
  securityStock: z.number().min(0).default(0),
  // Parafiscalité
  foner: z.number().min(0).default(0),
  pmfFiscal: z.number().default(0),
  // Fiscalité
  venteVAT: z.number().min(0).default(0),
  customsDuty: z.number().min(0).default(0),
  consumptionDuty: z.number().default(0),
  importVAT: z.number().min(0).default(0),
  netVAT: z.number().min(0).default(0),
});

type NonMiningPriceEditFormData = z.infer<typeof NonMiningPriceEditSchema>;

interface NonMiningPriceEditFormProps {
  priceStructure: {
    id: string;
    nomStructure: string;
    description: string | null;
    cardinale: "SUD" | "NORD" | "EST" | "OUEST";
    pmfCommercialCDF: number;
    exchangeRate?: { rate: number } | null;
    distributionCosts: {
      ogefrem: number;
      socirFees: number;
      sepSecurityCharges: number;
      additionalCapacitySPSA: number;
      lerexcomPetroleum: number;
      socComCharges: number;
      socComMargin: number;
    } | null;
    securityStock: {
      estStock: number;
      sudStock: number;
    } | null;
    parafiscality: {
      foner: number;
      pmfFiscal: number;
    } | null;
    fiscality: {
      venteVAT: number;
      customsDuty: number;
      consumptionDuty: number;
      importVAT: number;
      netVAT: number;
    } | null;
  };
}

export function NonMiningPriceEditForm({ priceStructure }: NonMiningPriceEditFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const rate = priceStructure.exchangeRate?.rate || 2500;

  const form = useForm({
    resolver: zodResolver(NonMiningPriceEditSchema),
    defaultValues: {
      nomStructure: priceStructure.nomStructure,
      description: priceStructure.description || "",
      cardinale: priceStructure.cardinale,
      pmfCommercialCDF: priceStructure.pmfCommercialCDF,
      rate: priceStructure.exchangeRate?.rate || 2500,
      ogefrem: priceStructure.distributionCosts?.ogefrem || 0,
      socirFees: priceStructure.distributionCosts?.socirFees || 0,
      sepSecurityCharges: priceStructure.distributionCosts?.sepSecurityCharges || 0,
      additionalCapacitySPSA: priceStructure.distributionCosts?.additionalCapacitySPSA || 0,
      lerexcomPetroleum: priceStructure.distributionCosts?.lerexcomPetroleum || 0,
      socComCharges: priceStructure.distributionCosts?.socComCharges || 0,
      socComMargin: priceStructure.distributionCosts?.socComMargin || 0,
      securityStock: (priceStructure.securityStock?.estStock || 0) + (priceStructure.securityStock?.sudStock || 0),
      foner: priceStructure.parafiscality?.foner || 0,
      pmfFiscal: priceStructure.parafiscality?.pmfFiscal || 0,
      venteVAT: priceStructure.fiscality?.venteVAT || 0,
      customsDuty: priceStructure.fiscality?.customsDuty || 0,
      consumptionDuty: priceStructure.fiscality?.consumptionDuty || 0,
      importVAT: priceStructure.fiscality?.importVAT || 0,
      netVAT: priceStructure.fiscality?.netVAT || 0,
    },
  });

  const onSubmit = async (data: NonMiningPriceEditFormData) => {
    setIsLoading(true);
    try {
      await updateNonMiningPriceStructure({
        id: priceStructure.id,
        ...data,
        rate: data.rate,
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
      });

      toast({ title: "Succès", description: "Structure de prix mise à jour avec succès" });
      router.push("/dashboard/non-mining-prices");
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast({ title: "Erreur", description: "Erreur lors de la mise à jour de la structure de prix", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/non-mining-prices">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">Modifier la Structure de Prix</h1>
            <p className="text-muted-foreground mt-2">
              Modifier la structure de prix non-minier
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations Générales</CardTitle>
            <CardDescription>
              Modifiez les informations de base de la structure de prix
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
                Équivalent USD: {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format((form.watch("pmfCommercialCDF") || 0) / rate)}
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
                  USD: {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format((form.watch("ogefrem") || 0) / rate)}
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
                  USD: {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format((form.watch("socirFees") || 0) / rate)}
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
                  USD: {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format((form.watch("sepSecurityCharges") || 0) / rate)}
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
                  USD: {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format((form.watch("additionalCapacitySPSA") || 0) / rate)}
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
                  USD: {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format((form.watch("lerexcomPetroleum") || 0) / rate)}
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
                  USD: {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format((form.watch("socComCharges") || 0) / rate)}
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
                  USD: {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format((form.watch("socComMargin") || 0) / rate)}
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
                  USD: {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format((form.watch("securityStock") || 0) / rate)}
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
                  USD: {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format((form.watch("venteVAT") || 0) / rate)}
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
                  USD: {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format((form.watch("customsDuty") || 0) / rate)}
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
                  USD: {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format((form.watch("consumptionDuty") || 0) / rate)}
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
                  USD: {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format((form.watch("importVAT") || 0) / rate)}
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
                  USD: {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format((form.watch("netVAT") || 0) / rate)}
                </div>
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
            {isLoading ? "Mise à jour..." : "Mettre à jour"}
          </Button>
        </div>
      </form>
    </div>
  );
}
