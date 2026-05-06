import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { Badge } from "@/components/badge";

type ProfitLossBreakdown = {
  sales: number;
  purchases: number;
  grossProfit: number;
  losses: number;
  netResult: number;
};

type Chart06Props = {
  data?: ProfitLossBreakdown;
};

export function Chart06({ data }: Chart06Props) {
  const fallback: ProfitLossBreakdown = {
    sales: 26864,
    purchases: 18200,
    grossProfit: 8664,
    losses: 1200,
    netResult: 7464,
  };
  const values = data ?? fallback;
  const baseForBar = Math.max(
    Math.abs(values.sales),
    Math.abs(values.purchases),
    Math.abs(values.grossProfit),
    Math.abs(values.losses),
    1
  );
  const barSales = (Math.abs(values.sales) / baseForBar) * 100;
  const barPurchases = (Math.abs(values.purchases) / baseForBar) * 100;
  const barProfit = (Math.abs(values.grossProfit) / baseForBar) * 100;
  const barLosses = (Math.abs(values.losses) / baseForBar) * 100;

  return (
    <Card className="gap-5">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <CardTitle>Benefices et pertes</CardTitle>
            <div className="flex items-start gap-2">
              <div className="font-semibold text-2xl">${Math.round(values.netResult).toLocaleString("fr-FR")}</div>
              <Badge className="mt-1.5 bg-emerald-500/24 text-emerald-500 border-none">
                Resultat net
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-xs bg-chart-4"
              ></div>
              <div className="text-[13px]/3 text-muted-foreground/50">
                Ventes
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-xs bg-chart-1"
              ></div>
              <div className="text-[13px]/3 text-muted-foreground/50">Achats</div>
            </div>
            <div className="flex items-center gap-2">
              <div
                aria-hidden="true"
                className="size-1.5 shrink-0 rounded-xs bg-chart-6"
              ></div>
              <div className="text-[13px]/3 text-muted-foreground/50">
                Benefice brut
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="flex gap-1 h-5">
          <div className="bg-chart-4 h-full" style={{ width: `${barSales}%` }}></div>
          <div
            className="bg-linear-to-r from-chart-2 to-chart-1 h-full"
            style={{ width: `${barPurchases}%` }}
          ></div>
          <div className="bg-chart-6 h-full" style={{ width: `${barProfit}%` }}></div>
          <div className="bg-chart-3 h-full" style={{ width: `${barLosses}%` }}></div>
        </div>
        <div>
          <div className="text-[13px]/3 text-muted-foreground/50 mb-3">
            Synthese financiere
          </div>
          <ul className="text-sm divide-y divide-border">
            <li className="py-2 flex items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full bg-chart-4"
                aria-hidden="true"
              ></span>
              <span className="grow text-muted-foreground">
                Chiffre d'affaires ventes.
              </span>
              <span className="text-[13px]/3 font-medium text-foreground/70">
                ${Math.round(values.sales).toLocaleString("fr-FR")}
              </span>
            </li>
            <li className="py-2 flex items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full bg-linear-to-r from-chart-2 to-chart-1"
                aria-hidden="true"
              ></span>
              <span className="grow text-muted-foreground">
                Cout des approvisionnements.
              </span>
              <span className="text-[13px]/3 font-medium text-foreground/70">
                ${Math.round(values.purchases).toLocaleString("fr-FR")}
              </span>
            </li>
            <li className="py-2 flex items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full bg-chart-6"
                aria-hidden="true"
              ></span>
              <span className="grow text-muted-foreground">
                Benefice brut.
              </span>
              <span className="text-[13px]/3 font-medium text-foreground/70">
                ${Math.round(values.grossProfit).toLocaleString("fr-FR")}
              </span>
            </li>
            <li className="py-2 flex items-center gap-2">
              <span
                className="size-2 shrink-0 rounded-full bg-chart-3"
                aria-hidden="true"
              ></span>
              <span className="grow text-muted-foreground">
                Pertes d'exploitation.
              </span>
              <span className="text-[13px]/3 font-medium text-foreground/70">
                ${Math.round(values.losses).toLocaleString("fr-FR")}
              </span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
