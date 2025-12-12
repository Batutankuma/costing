import { notFound } from "next/navigation";
import { getKinshasaCostingById } from "../actions";
import { getProducts } from "@/app/dashboard/products/actions";
import KinshasaCostingForm from "../kinshasa-costing-form";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil } from "lucide-react";

type RoutePageProps = {
  params?: Promise<{ id: string }>;
};

export default async function EditKinshasaCostingPage(props: RoutePageProps) {
  const resolved = props.params ? await props.params : null;
  if (!resolved?.id) {
    notFound();
  }

  const costing = await getKinshasaCostingById(resolved.id);
  if (!costing) {
    notFound();
  }

  const products = await getProducts();
  const toBreakdown = (arr: any): Array<{
    label: string;
    client: number;
    threshold: number;
    proposal: number;
    mag: number;
    afterMag: number;
  }> =>
    Array.isArray(arr)
      ? arr
          .map((row: any) => ({
            label: typeof row?.label === "string" ? row.label : "",
            client: Number(row?.client ?? 0),
            threshold: Number(row?.threshold ?? 0),
            proposal: Number(row?.proposal ?? 0),
            mag: Number(row?.mag ?? 0),
            afterMag: Number(row?.afterMag ?? 0),
          }))
          .filter((r) => r.label !== "")
      : [];

  const normalized = {
    ...costing,
    currency: costing.currency === "USD" ? ("USD" as const) : ("CDF" as const),
    volumeM3: Number(costing.volumeM3 ?? 0),
    unitPriceUsd: Number(costing.unitPriceUsd ?? 0),
    clientExchangeRate: Number(costing.clientExchangeRate ?? 0),
    benchmarkExchangeRate: Number(costing.benchmarkExchangeRate ?? 0),
    engenPriceCDF: Number(costing.engenPriceCDF ?? 0),
    engenPriceUSD: Number(costing.engenPriceUSD ?? 0),
    cdfBreakdown: toBreakdown(costing.cdfBreakdown),
    usdBreakdown: toBreakdown(costing.usdBreakdown),
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <Pencil className="h-9 w-9 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modifier Costing</h1>
          <p className="text-muted-foreground">{costing.title}</p>
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <KinshasaCostingForm products={products} initialData={{ ...normalized, id: costing.id } as typeof normalized & { id: string }} />
        </CardContent>
      </Card>
    </div>
  );
}

