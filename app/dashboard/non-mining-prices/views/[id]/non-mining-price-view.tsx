"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Download } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { SummaryTable } from "../summary-table";
import ExportExcel from "@/components/exportExcel";

interface NonMiningPriceViewProps {
  priceStructure: {
    id: string;
    nomStructure: string;
    description: string | null;
    cardinale: "SUD" | "NORD" | "EST" | "OUEST";
    pmfCommercialUSD: number;
    pmfCommercialCDF: number;
    priceRefCDF: number;
    priceRefUSD: number;
    priceRefUSDPerLitre: number;
    createdAt: Date;
    updatedAt: Date;
    user: {
      name: string;
      email: string;
    };
    exchangeRate: {
      rate: number;
      deviseBase: string;
      deviseTarget: string;
    };
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
  };
}

export function NonMiningPriceView({ priceStructure }: NonMiningPriceViewProps) {
  const formatCurrency = (amount: number, currency: string = "CDF") => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencySmall = (amount: number, currency: string = "CDF") => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/non-mining-prices">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-primary">{priceStructure.nomStructure}</h1>
              <p className="text-muted-foreground mt-2">
                Structure de prix non-minier - {priceStructure.cardinale}
              </p>
            </div>
          </div>
          <div className="flex space-x-2 no-print">
            <Button asChild>
              <Link href={`/dashboard/non-mining-prices/${priceStructure.id}`}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Link>
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Download className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
            <ExportExcel
              data={[]}
              filename={`structure-non-minier-${priceStructure.nomStructure}`}
              customHtml={(function(){
                const rate = priceStructure.exchangeRate?.rate || 2500;
                const rows: Array<{desc: string; cdf?: number|null; usd?: number|null; highlight?: 'yellow'|'blue'|'green' }>=[];
                const add = (desc: string, cdf?: number|null, usd?: number|null, highlight?: 'yellow'|'blue'|'green') => rows.push({desc, cdf: cdf ?? 0, usd: typeof usd==='number'?usd:(typeof cdf==='number'? cdf!/rate:0), highlight});
                add("PMF commercial", priceStructure.pmfCommercialCDF, priceStructure.pmfCommercialUSD, 'yellow');
                const d = priceStructure.distributionCosts;
                if (d) {
                  add("Ogefrem", d.ogefrem);
                  add("Frais & services Socir", d.socirFees);
                  add("Charges d'exploitation SEP, St.Sécurité et Stratég.", d.sepSecurityCharges);
                  add("Charges capacités additionnelles SPSA", d.additionalCapacitySPSA);
                  add("Lerexcom Petroleum", d.lerexcomPetroleum);
                  add("Charges d'exploitation Soc Com", d.socComCharges);
                  add("Marges Soc, Com", d.socComMargin);
                  add("Total frais de Distribution", d.totalDistribution, undefined, 'yellow');
                }
                const s = priceStructure.securityStock;
                if (s) add("Stock Sécurité", s.totalSecurity);
                const p = priceStructure.parafiscality;
                if (p) { add("FONER", p.foner); add("PMF Fiscal", p.pmfFiscal); }
                const f = priceStructure.fiscality;
                if (f) {
                  add("TVA à la vente", f.venteVAT);
                  add("Droit de Douane", f.customsDuty);
                  add("Droits de consommation", f.consumptionDuty);
                  add("TVA à l'importation", f.importVAT);
                  add("Total Fiscalité 1", f.totalFiscality1, undefined, 'yellow');
                  add("TVA nette à l'intérieur", f.netVAT);
                  add("Total Fiscalité 2", f.totalFiscality2, undefined, 'yellow');
                }
                add("Prix de reference en $/M3", priceStructure.priceRefCDF, priceStructure.priceRefUSD, 'blue');
                if (priceStructure.finalPricing) add("Prix à appliquer", priceStructure.finalPricing.appliedPriceCDF, priceStructure.finalPricing.appliedPriceUSD, 'green');

                const style = `
                  <style>
                    table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; }
                    th, td { border: 1px solid #9ca3af; padding: 6px; text-align: right; }
                    th:first-child, td:first-child { text-align: left; }
                    .y { background: #fff3b0; font-weight: bold; }
                    .b { background: #dbeafe; font-weight: bold; }
                    .g { background: #dcfce7; font-weight: bold; }
                  </style>
                `;
                const header = `
                  <table>
                    <tr>
                      <th>Description</th>
                      <th>CDF</th>
                      <th>USD</th>
                    </tr>
                  `;
                const body = rows.map(r => `<tr class="${r.highlight==='yellow'?'y':r.highlight==='blue'?'b':r.highlight==='green'?'g':''}"><td>${r.desc}</td><td>${r.cdf ?? ''}</td><td>${r.usd ?? ''}</td></tr>`).join('');
                const footer = `</table>`;
                return `<!DOCTYPE html><html><head>${style}</head><body>${header}${body}${footer}</body></html>`;
              })()}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations générales */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations Générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Structure</label>
                  <p className="text-lg font-semibold">{priceStructure.nomStructure}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Zone</label>
                  <div className="mt-1">
                    <Badge variant="outline" className="capitalize">
                      {priceStructure.cardinale}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Taux de change</label>
                  <p className="text-lg font-semibold">
                    1 {priceStructure.exchangeRate.deviseBase} = {priceStructure.exchangeRate.rate} {priceStructure.exchangeRate.deviseTarget}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Créé le</label>
                  <p className="text-lg font-semibold">
                    {format(new Date(priceStructure.createdAt), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                </div>
              </div>
              {priceStructure.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-sm mt-1">{priceStructure.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* PMF Commercial */}
          <Card>
            <CardHeader>
              <CardTitle>PMF Commercial</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">PMF Commercial</p>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(priceStructure.pmfCommercialCDF)}
                  </p>
                  <p className="text-xl font-semibold text-muted-foreground">
                    {formatCurrency(priceStructure.pmfCommercialUSD, "USD")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Frais de Distribution */}
          {priceStructure.distributionCosts && (
            <Card>
              <CardHeader>
                <CardTitle>Frais de Distribution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm">Ogefrem</span>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(priceStructure.distributionCosts.ogefrem)}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(priceStructure.distributionCosts.ogefrem / (priceStructure.exchangeRate?.rate || 2500), "USD")}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm">Frais & services Socir</span>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(priceStructure.distributionCosts.socirFees)}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(priceStructure.distributionCosts.socirFees / (priceStructure.exchangeRate?.rate || 2500), "USD")}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm">Charges SEP, Sécurité et Stratégie</span>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(priceStructure.distributionCosts.sepSecurityCharges)}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(priceStructure.distributionCosts.sepSecurityCharges / (priceStructure.exchangeRate?.rate || 2500), "USD")}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm">Capacités additionnelles SPSA</span>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(priceStructure.distributionCosts.additionalCapacitySPSA)}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(priceStructure.distributionCosts.additionalCapacitySPSA / (priceStructure.exchangeRate?.rate || 2500), "USD")}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm">Lerexcom Petroleum</span>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(priceStructure.distributionCosts.lerexcomPetroleum)}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(priceStructure.distributionCosts.lerexcomPetroleum / (priceStructure.exchangeRate?.rate || 2500), "USD")}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm">Charges Soc Com</span>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(priceStructure.distributionCosts.socComCharges)}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(priceStructure.distributionCosts.socComCharges / (priceStructure.exchangeRate?.rate || 2500), "USD")}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm">Marges Soc, Com</span>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(priceStructure.distributionCosts.socComMargin)}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(priceStructure.distributionCosts.socComMargin / (priceStructure.exchangeRate?.rate || 2500), "USD")}</div>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total frais de Distribution</span>
                    <div className="text-right">
                      <div className="text-primary">{formatCurrency(priceStructure.distributionCosts.totalDistribution)}</div>
                      <div className="text-sm text-muted-foreground">{formatCurrency(priceStructure.distributionCosts.totalDistribution / (priceStructure.exchangeRate?.rate || 2500), "USD")}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stock de Sécurité */}
          {priceStructure.securityStock && (
            <Card>
              <CardHeader>
                <CardTitle>Stock de Sécurité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Stock Sécurité</p>
                  <p className="text-xl font-bold">{formatCurrency(priceStructure.securityStock.totalSecurity)}</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(priceStructure.securityStock.totalSecurity / (priceStructure.exchangeRate?.rate || 2500), "USD")}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Parafiscalité */}
          {priceStructure.parafiscality && (
            <Card>
              <CardHeader>
                <CardTitle>Parafiscalité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">FONER</p>
                    <p className="text-xl font-bold">{formatCurrency(priceStructure.parafiscality.foner)}</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(priceStructure.parafiscality.foner / (priceStructure.exchangeRate?.rate || 2500), "USD")}</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">PMF Fiscal</p>
                    <p className={`text-xl font-bold ${priceStructure.parafiscality.pmfFiscal < 0 ? 'text-destructive' : ''}`}>
                      {formatCurrency(priceStructure.parafiscality.pmfFiscal)}
                    </p>
                    <p className={`text-sm ${priceStructure.parafiscality.pmfFiscal < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {formatCurrency(priceStructure.parafiscality.pmfFiscal / (priceStructure.exchangeRate?.rate || 2500), "USD")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fiscalité */}
          {priceStructure.fiscality && (
            <Card>
              <CardHeader>
                <CardTitle>Fiscalité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm">TVA à la vente</span>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(priceStructure.fiscality.venteVAT)}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(priceStructure.fiscality.venteVAT / (priceStructure.exchangeRate?.rate || 2500), "USD")}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm">Droit de Douane</span>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(priceStructure.fiscality.customsDuty)}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(priceStructure.fiscality.customsDuty / (priceStructure.exchangeRate?.rate || 2500), "USD")}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm">Droits de consommation</span>
                    <div className="text-right">
                      <div className={`font-medium ${priceStructure.fiscality.consumptionDuty < 0 ? 'text-destructive' : ''}`}>
                        {formatCurrency(priceStructure.fiscality.consumptionDuty)}
                      </div>
                      <div className={`text-xs ${priceStructure.fiscality.consumptionDuty < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {formatCurrency(priceStructure.fiscality.consumptionDuty / (priceStructure.exchangeRate?.rate || 2500), "USD")}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm">TVA à l'importation</span>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(priceStructure.fiscality.importVAT)}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(priceStructure.fiscality.importVAT / (priceStructure.exchangeRate?.rate || 2500), "USD")}</div>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Fiscalité 1</span>
                    <div className="text-right">
                      <div className="text-primary">{formatCurrency(priceStructure.fiscality.totalFiscality1)}</div>
                      <div className="text-sm text-muted-foreground">{formatCurrency(priceStructure.fiscality.totalFiscality1 / (priceStructure.exchangeRate?.rate || 2500), "USD")}</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm">TVA nette à l'intérieur</span>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(priceStructure.fiscality.netVAT)}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(priceStructure.fiscality.netVAT / (priceStructure.exchangeRate?.rate || 2500), "USD")}</div>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Fiscalité 2</span>
                    <div className="text-right">
                      <div className="text-primary">{formatCurrency(priceStructure.fiscality.totalFiscality2)}</div>
                      <div className="text-sm text-muted-foreground">{formatCurrency(priceStructure.fiscality.totalFiscality2 / (priceStructure.exchangeRate?.rate || 2500), "USD")}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Résumé et prix finaux */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Résumé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Créé par</label>
                <p className="font-semibold">{priceStructure.user.name}</p>
                <p className="text-sm text-muted-foreground">{priceStructure.user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Dernière modification</label>
                <p className="font-semibold">
                  {format(new Date(priceStructure.updatedAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Prix de référence */}
          <Card>
            <CardHeader>
              <CardTitle>Prix de Référence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border-2 border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">Prix de référence en $/M3</p>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(priceStructure.priceRefCDF)}
                  </p>
                  <p className="text-xl font-semibold text-muted-foreground">
                    {formatCurrency(priceStructure.priceRefUSD, "USD")}
                  </p>
                </div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Prix de référence (USD/Litre)</p>
                <p className="text-xl font-bold">
                  {formatCurrencySmall(priceStructure.priceRefUSDPerLitre, "USD")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Prix à appliquer */}
          {priceStructure.finalPricing && (
            <Card>
              <CardHeader>
                <CardTitle>Prix à Appliquer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                  <p className="text-sm text-muted-foreground mb-2">Prix à appliquer</p>
                  <div className="space-y-2">
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrencySmall(priceStructure.finalPricing.appliedPriceCDF)}
                    </p>
                    <p className="text-xl font-semibold text-green-600">
                      {formatCurrencySmall(priceStructure.finalPricing.appliedPriceUSD, "USD")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Tableau de résumé */}
      <div className="mt-8 print-section">
        <div className="hidden print:block mb-4">
          <div className="text-center">
            <h2 className="text-xl font-bold">Structure Non-Minier</h2>
            <div className="text-sm">
              <span className="font-medium">Structure:</span> {priceStructure.nomStructure} ·
              <span className="font-medium"> Zone:</span> {priceStructure.cardinale} ·
              <span className="font-medium"> Taux:</span> 1 {priceStructure.exchangeRate.deviseBase} = {priceStructure.exchangeRate.rate} {priceStructure.exchangeRate.deviseTarget} ·
              <span className="font-medium"> Date:</span> {format(new Date(priceStructure.createdAt), "dd MMM yyyy", { locale: fr })}
            </div>
          </div>
        </div>
        <SummaryTable data={priceStructure} />
      </div>
      <style jsx global>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          html, body { background: #ffffff !important; color: #000000 !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          body * { visibility: hidden !important; }
          .print-section, .print-section * { visibility: visible !important; }
          .print-section { position: absolute; left: 0; top: 0; width: 100%; }
          .card, .printable, .print-table { box-shadow: none !important; }
          .print-table th, .print-table td { border: 1px solid #d1d5db !important; padding: 6px !important; }
          tr.bg-yellow-50 { background: #fff3b0 !important; }
          tr.dark\\:bg-yellow-900\/20 { background: #fff3b0 !important; }
          tr.bg-blue-50 { background: #dbeafe !important; }
          tr.bg-green-50 { background: #dcfce7 !important; }
        }
      `}</style>
    </div>
  );
}
