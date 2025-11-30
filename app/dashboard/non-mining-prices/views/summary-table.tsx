"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryTableProps {
  data: {
    pmfCommercialCDF: number;
    distributionCosts: {
      ogefrem: number;
      socirFees: number;
      sepSecurityCharges: number;
      additionalCapacitySPSA: number;
      lerexcomPetroleum: number;
      socComCharges: number;
      socComMargin: number;
      totalDistribution: number;
    } | null;
    securityStock: {
      estStock: number;
      sudStock: number;
      totalSecurity: number;
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
      totalFiscality1: number;
      netVAT: number;
      totalFiscality2: number;
    } | null;
    finalPricing: {
      referencePriceCDF: number;
      referencePriceUSD: number;
      appliedPriceCDF: number;
      appliedPriceUSD: number;
    } | null;
    exchangeRate: {
      rate: number;
    } | null;
  };
}

export function SummaryTable({ data }: SummaryTableProps) {
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

  const rate = data.exchangeRate?.rate || 2500;

  const distribution = data.distributionCosts ?? {
    ogefrem: 0,
    socirFees: 0,
    sepSecurityCharges: 0,
    additionalCapacitySPSA: 0,
    lerexcomPetroleum: 0,
    socComCharges: 0,
    socComMargin: 0,
    totalDistribution: 0,
  };

  const security = data.securityStock ?? {
    estStock: 0,
    sudStock: 0,
    totalSecurity: 0,
  };

  const para = data.parafiscality ?? {
    foner: 0,
    pmfFiscal: 0,
  };

  const fisc = data.fiscality ?? {
    venteVAT: 0,
    customsDuty: 0,
    consumptionDuty: 0,
    importVAT: 0,
    totalFiscality1: 0,
    netVAT: 0,
    totalFiscality2: 0,
  };

  const finalP = data.finalPricing ?? {
    referencePriceCDF: 0,
    referencePriceUSD: 0,
    appliedPriceCDF: 0,
    appliedPriceUSD: 0,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Résumé des Prix - Structure Non-Minier</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse print-table">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Description</th>
                <th className="text-right p-2 font-medium">CDF</th>
                <th className="text-right p-2 font-medium">USD</th>
              </tr>
            </thead>
            <tbody>
              {/* PMF Commercial */}
              <tr>
                <td className="p-2 font-medium">PMF commercial</td>
                <td className="p-2 text-right font-medium">{formatCurrency(data.pmfCommercialCDF)}</td>
                <td className="p-2 text-right font-medium">{formatCurrency(data.pmfCommercialCDF / rate, "USD")}</td>
              </tr>

              {/* Frais de Distribution */}
              <tr>
                <td className="p-2 pl-4 text-sm text-muted-foreground">Ogefrem</td>
                <td className="p-2 text-right text-sm">{formatCurrency(distribution.ogefrem)}</td>
                <td className="p-2 text-right text-sm">{formatCurrency(distribution.ogefrem / rate, "USD")}</td>
              </tr>
              <tr>
                <td className="p-2 pl-4 text-sm text-muted-foreground">Frais & services Socir</td>
                <td className="p-2 text-right text-sm">{formatCurrency(distribution.socirFees)}</td>
                <td className="p-2 text-right text-sm">{formatCurrency(distribution.socirFees / rate, "USD")}</td>
              </tr>
              <tr>
                <td className="p-2 pl-4 text-sm text-muted-foreground">Charges d'exploitation SEP, St.Sécurité et Stratég.</td>
                <td className="p-2 text-right text-sm">{formatCurrency(distribution.sepSecurityCharges)}</td>
                <td className="p-2 text-right text-sm">{formatCurrency(distribution.sepSecurityCharges / rate, "USD")}</td>
              </tr>
              <tr>
                <td className="p-2 pl-4 text-sm text-muted-foreground">Charges capacités additionnelles SPSA</td>
                <td className="p-2 text-right text-sm">{formatCurrency(distribution.additionalCapacitySPSA)}</td>
                <td className="p-2 text-right text-sm">{formatCurrency(distribution.additionalCapacitySPSA / rate, "USD")}</td>
              </tr>
              <tr>
                <td className="p-2 pl-4 text-sm text-muted-foreground">Lerexcom Petroleum</td>
                <td className="p-2 text-right text-sm">{formatCurrency(distribution.lerexcomPetroleum)}</td>
                <td className="p-2 text-right text-sm">{formatCurrency(distribution.lerexcomPetroleum / rate, "USD")}</td>
              </tr>
              <tr>
                <td className="p-2 pl-4 text-sm text-muted-foreground">Charges d'exploitation Soc Com</td>
                <td className="p-2 text-right text-sm">{formatCurrency(distribution.socComCharges)}</td>
                <td className="p-2 text-right text-sm">{formatCurrency(distribution.socComCharges / rate, "USD")}</td>
              </tr>
              <tr>
                <td className="p-2 pl-4 text-sm text-muted-foreground">Marges Soc, Com</td>
                <td className="p-2 text-right text-sm">{formatCurrency(distribution.socComMargin)}</td>
                <td className="p-2 text-right text-sm">{formatCurrency(distribution.socComMargin / rate, "USD")}</td>
              </tr>
              
              {/* Total frais de Distribution */}
              <tr className="bg-yellow-50 dark:bg-yellow-900/20 font-bold">
                <td className="p-2">Total frais de Distribution</td>
                <td className="p-2 text-right">{formatCurrency(distribution.totalDistribution)}</td>
                <td className="p-2 text-right">{formatCurrency(distribution.totalDistribution / rate, "USD")}</td>
              </tr>

              {/* Stock de Sécurité */}
              <tr>
                <td className="p-2">Stock Sécurité</td>
                <td className="p-2 text-right">{formatCurrency(security.totalSecurity)}</td>
                <td className="p-2 text-right">{formatCurrency(security.totalSecurity / rate, "USD")}</td>
              </tr>

              {/* Parafiscalité */}
              <tr>
                <td className="p-2">FONER</td>
                <td className="p-2 text-right">{formatCurrency(para.foner)}</td>
                <td className="p-2 text-right">{formatCurrency(para.foner / rate, "USD")}</td>
              </tr>
              <tr>
                <td className="p-2">PMF Fiscal</td>
                <td className={`p-2 text-right ${para.pmfFiscal < 0 ? 'text-red-600' : ''}`}>
                  {formatCurrency(para.pmfFiscal)}
                </td>
                <td className={`p-2 text-right ${para.pmfFiscal < 0 ? 'text-red-600' : ''}`}>
                  {formatCurrency(para.pmfFiscal / rate, "USD")}
                </td>
              </tr>

              {/* Fiscalité */}
              <tr>
                <td className="p-2">TVA à la vente</td>
                <td className="p-2 text-right">{formatCurrency(fisc.venteVAT)}</td>
                <td className="p-2 text-right">{formatCurrency(fisc.venteVAT / rate, "USD")}</td>
              </tr>
              <tr>
                <td className="p-2">Droit de Douane</td>
                <td className="p-2 text-right">{formatCurrency(fisc.customsDuty)}</td>
                <td className="p-2 text-right">{formatCurrency(fisc.customsDuty / rate, "USD")}</td>
              </tr>
              <tr>
                <td className="p-2">Droits de consommation</td>
                <td className={`p-2 text-right ${fisc.consumptionDuty < 0 ? 'text-red-600' : ''}`}>
                  {formatCurrency(fisc.consumptionDuty)}
                </td>
                <td className={`p-2 text-right ${fisc.consumptionDuty < 0 ? 'text-red-600' : ''}`}>
                  {formatCurrency(fisc.consumptionDuty / rate, "USD")}
                </td>
              </tr>
              <tr>
                <td className="p-2">TVA à l'importation</td>
                <td className="p-2 text-right">{formatCurrency(fisc.importVAT)}</td>
                <td className="p-2 text-right">{formatCurrency(fisc.importVAT / rate, "USD")}</td>
              </tr>

              {/* Total Fiscalité 1 */}
              <tr className="bg-yellow-50 dark:bg-yellow-900/20 font-bold">
                <td className="p-2">Total Fiscalité 1</td>
                <td className="p-2 text-right">{formatCurrency(fisc.totalFiscality1)}</td>
                <td className="p-2 text-right">{formatCurrency(fisc.totalFiscality1 / rate, "USD")}</td>
              </tr>

              <tr>
                <td className="p-2">TVA nette à l'intérieur</td>
                <td className="p-2 text-right">{formatCurrency(fisc.netVAT)}</td>
                <td className="p-2 text-right">{formatCurrency(fisc.netVAT / rate, "USD")}</td>
              </tr>

              {/* Total Fiscalité 2 */}
              <tr className="bg-yellow-50 dark:bg-yellow-900/20 font-bold">
                <td className="p-2">Total Fiscalité 2</td>
                <td className="p-2 text-right">{formatCurrency(fisc.totalFiscality2)}</td>
                <td className="p-2 text-right">{formatCurrency(fisc.totalFiscality2 / rate, "USD")}</td>
              </tr>

              {/* Prix de référence */}
              <tr className="bg-blue-50 dark:bg-blue-900/20 font-bold text-lg">
                <td className="p-2">Prix de référence en $/M3</td>
                <td className="p-2 text-right">{formatCurrency(finalP.referencePriceCDF)}</td>
                <td className="p-2 text-right">{formatCurrency(finalP.referencePriceUSD, "USD")}</td>
              </tr>

              {/* Prix à appliquer */}
              <tr className="bg-green-50 dark:bg-green-900/20 font-bold text-lg">
                <td className="p-2">Prix à appliquer</td>
                <td className="p-2 text-right">{formatCurrencySmall(finalP.appliedPriceCDF)}</td>
                <td className="p-2 text-right">{formatCurrencySmall(finalP.appliedPriceUSD, "USD")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
