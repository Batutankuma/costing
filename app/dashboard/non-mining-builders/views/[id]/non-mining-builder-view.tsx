import { getNonMiningBuilderById } from "../../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface NonMiningBuilderViewProps {
  id: string;
}

export async function NonMiningBuilderView({ id }: NonMiningBuilderViewProps) {
  const builder = await getNonMiningBuilderById(id);

  const formatCurrency = (amount: number | null | undefined) => {
    const v = typeof amount === "number" ? amount : 0;
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(v);
  };

  return (
    <div className="space-y-6">
      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Générales</CardTitle>
          <CardDescription>
            Détails du cost build up non-minier
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Titre</label>
              <p className="text-lg font-semibold">{builder.title}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Unité</label>
              <div className="mt-1">
                <Badge variant="outline">
                  {builder.unit === "USD_M3" ? "USD/M³" : "USD/Litre"}
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Créé par</label>
              <p className="text-sm">{builder.user.name} ({builder.user.email})</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Date de création</label>
              <p className="text-sm">
                {new Date(builder.createdAt).toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          {builder.description && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-sm mt-1">{builder.description}</p>
            </div>
          )}
          {builder.nonMiningPriceStructure && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Structure Non-Minier Associée</label>
              <p className="text-sm mt-1">
                {builder.nonMiningPriceStructure.nomStructure} 
                (Taux: {builder.nonMiningPriceStructure.exchangeRate.rate} {builder.nonMiningPriceStructure.exchangeRate.deviseBase}/{builder.nonMiningPriceStructure.exchangeRate.deviseTarget})
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coûts de base */}
      {builder.baseCosts && (
        <Card>
          <CardHeader>
            <CardTitle>1. Coûts de Base du Produit & Transport Initial</CardTitle>
            <CardDescription>
              Coûts fondamentaux du produit et du transport initial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span>Platt's or FOB:</span>
                <span className="font-medium">{formatCurrency(builder.baseCosts.plattsFOBUSD)}</span>
              </div>
              <div className="flex justify-between">
                <span>Transport (camion):</span>
                <span className="font-medium">{formatCurrency(builder.baseCosts.truckTransportUSD)}</span>
              </div>
              <div className="flex justify-between">
                <span>Brut C&F:</span>
                <span className="font-medium">{formatCurrency(builder.baseCosts.brutCFUSD)}</span>
              </div>
              <div className="flex justify-between">
                <span>Agency/Trade Sce/Customs:</span>
                <span className="font-medium">{formatCurrency(builder.baseCosts.agencyCustomsUSD)}</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Prix de revient (Coût d'acquisition):</span>
              <span className="text-primary">{formatCurrency(builder.baseCosts.acquisitionCostUSD)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coûts fournisseur DDU */}
      {builder.supplierDDU && (
        <Card>
          <CardHeader>
            <CardTitle>2. Coûts et Marge du Fournisseur pour l'Offre DDU</CardTitle>
            <CardDescription>
              Coûts supplémentaires du fournisseur pour la livraison DDU
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span>Frais stockage/hospitality:</span>
                <span className="font-medium">{formatCurrency(builder.supplierDDU.storageHospitalityUSD)}</span>
              </div>
              <div className="flex justify-between">
                <span>ANR-Déchargement-OCC-Hydrocarbures:</span>
                <span className="font-medium">{formatCurrency(builder.supplierDDU.anrDechargementUSD)}</span>
              </div>
              <div className="flex justify-between">
                <span>Marge du Fournisseur:</span>
                <span className="font-medium">{formatCurrency(builder.supplierDDU.supplierMarginUSD)}</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Prix de vente DDU (Delivered Duty Unpaid):</span>
              <span className="text-primary">{formatCurrency(builder.supplierDDU.sellingPriceDDUUSD)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Douanes */}
      {builder.customs && (
        <Card>
          <CardHeader>
            <CardTitle>3. Coûts Collectés par la Douane</CardTitle>
            <CardDescription>
              Droits de douane et taxes gouvernementales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span>CUSTOMS DUTIES / Droit de douane:</span>
                <span className="font-medium">{formatCurrency(builder.customs.customsDutyUSD)}</span>
              </div>
              <div className="flex justify-between">
                <span>VAT import:</span>
                <span className="font-medium">{formatCurrency(builder.customs.importVATUSD)}</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Droits Douaniers & TVA:</span>
              <span className="text-primary">{formatCurrency(builder.customs.subtotalUSD)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Redevances */}
      {builder.levies && (
        <Card>
          <CardHeader>
            <CardTitle>4. Redevances (Levies)</CardTitle>
            <CardDescription>
              Redevances collectées par la douane
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span>ROAD FUND (FONER):</span>
                <span className="font-medium">{formatCurrency(builder.levies.fonerUSD || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Stock de sécur SUD / Marquage moléculaire:</span>
                <span className="font-medium">{formatCurrency(builder.levies.molecularMarkingOrStockUSD || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Effort de reconstruction & Stock Stratégique:</span>
                <span className="font-medium">{formatCurrency(builder.levies.reconstructionStrategicUSD || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Intervention Économique & Autres:</span>
                <span className="font-medium">{formatCurrency(builder.levies.economicInterventionUSD || 0)}</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Redevances (Levies) Collectées par la Douane:</span>
              <span className="text-primary">{formatCurrency(builder.levies.totalLeviesUSD)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transport additionnel */}
      {builder.transport && (
        <Card>
          <CardHeader>
            <CardTitle>5. Coûts de Transport Additionnels</CardTitle>
            <CardDescription>
              Transport final vers la mine
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex justify-between">
                <span>Freight to Mine from L'shi:</span>
                <span className="font-medium">{formatCurrency(builder.transport.freightToMineUSD || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pertes (300 litres/camion):</span>
                <span className="font-medium">{formatCurrency(builder.transport.lossesLitresPerTruck || 0)}</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Frais de transport finaux:</span>
              <span className="text-primary">{formatCurrency(builder.transport.totalTransportFinalUSD || 0)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prix final */}
      {builder.totals && (
        <Card>
          <CardHeader>
            <CardTitle>Prix de Vente Final</CardTitle>
            <CardDescription>
              Calcul du prix DDP final
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border-2 border-green-200 dark:border-green-800">
              <p className="text-sm text-muted-foreground mb-2">Prix de vente DDP (Delivered Duty Paid)</p>
              <p className="text-4xl font-bold text-green-600">
                {formatCurrency(builder.totals.priceDDPUSD || 0)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                DDU: {formatCurrency(builder.totals.priceDDUUSD || 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
