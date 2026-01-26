import { getKinshasaCostings } from "./actions";
import KinshasaCostingTable from "./data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fuel } from "lucide-react";

export default async function KinshasaCostingsPage() {
  const costings = await getKinshasaCostings();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Fuel className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Costings Kinshasa</h1>
            <p className="text-muted-foreground">Harmonisez les structures de prix pour Kinshasa.</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des costings</CardTitle>
        </CardHeader>
        <CardContent>
          <KinshasaCostingTable
            data={costings.map((item: any) => ({
              id: item.id,
              title: item.title,
              currency: item.currency as "USD" | "CDF",
              volumeM3: item.volumeM3,
              unitPriceUsd: item.unitPriceUsd,
              product: item.product,
              updatedAt: item.updatedAt,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}

