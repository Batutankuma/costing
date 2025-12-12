import { notFound } from "next/navigation";
import { getKinshasaCostingById } from "../../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fuel, FileDigit } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const formatNumber = (value: number) =>
  Number(value ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type RoutePageProps = {
  params?: Promise<{ id: string }>;
};

type BreakdownRow = {
  label: string;
  client: number;
  threshold: number;
  proposal: number;
  mag: number;
  afterMag: number;
};

export default async function KinshasaCostingViewPage(props: RoutePageProps) {
  const resolved = props.params ? await props.params : null;
  if (!resolved?.id) {
    notFound();
  }

  const costing = await getKinshasaCostingById(resolved.id);
  if (!costing) {
    notFound();
  }

  const cdfRows: BreakdownRow[] = Array.isArray(costing.cdfBreakdown) 
    ? (costing.cdfBreakdown as unknown as BreakdownRow[]) 
    : [];
  const usdRows: BreakdownRow[] = Array.isArray(costing.usdBreakdown) 
    ? (costing.usdBreakdown as unknown as BreakdownRow[]) 
    : [];

  const renderTable = (rows: BreakdownRow[], title: string) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileDigit className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 text-left">
              <th className="p-2">Libellé</th>
              <th className="p-2 text-right">Client</th>
              <th className="p-2 text-right">Seuil rentab.</th>
              <th className="p-2 text-right">Prix proposé</th>
              <th className="p-2 text-right">MAG</th>
              <th className="p-2 text-right">Après MAG</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, index) => (
                <tr key={`${row.label}-${index}`} className="border-t">
                  <td className="p-2 font-medium">{row.label}</td>
                  <td className="p-2 text-right">{formatNumber(row.client)}</td>
                  <td className="p-2 text-right">{formatNumber(row.threshold)}</td>
                  <td className="p-2 text-right">{formatNumber(row.proposal)}</td>
                  <td className="p-2 text-right">{formatNumber(row.mag)}</td>
                  <td className="p-2 text-right">{formatNumber(row.afterMag)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">
                  Aucune donnée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Fuel className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{costing.title}</h1>
            <p className="text-muted-foreground">
              Produit : <span className="font-semibold">{costing.product?.name ?? "—"}</span>
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href={`/dashboard/kinshasa-costings/${costing.id}`}>Modifier</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Résumé</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-sm">Devise</p>
            <p className="text-lg font-semibold">{costing.currency}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Volume (m³)</p>
            <p className="text-lg font-semibold">{formatNumber(costing.volumeM3)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Prix unitaire USD</p>
            <p className="text-lg font-semibold">${formatNumber(costing.unitPriceUsd)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Taux client</p>
            <p className="text-lg font-semibold">{formatNumber(costing.clientExchangeRate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Taux de référence</p>
            <p className="text-lg font-semibold">{formatNumber(costing.benchmarkExchangeRate)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Prix ENGEN (CDF)</p>
            <p className="text-lg font-semibold">{formatNumber(costing.engenPriceCDF)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Prix ENGEN (USD)</p>
            <p className="text-lg font-semibold">${formatNumber(costing.engenPriceUSD)}</p>
          </div>
          {costing.notes && (
            <div className="md:col-span-2 lg:col-span-3">
              <p className="text-muted-foreground text-sm">Notes</p>
              <p>{costing.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {renderTable(cdfRows, "Structure en CDF")}
      {renderTable(usdRows, "Structure en USD")}
    </div>
  );
}

