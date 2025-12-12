import { listPriceReferences } from "./actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DataTable from "./data-table";
import { DollarSign } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const res = await listPriceReferences();
  const items = res?.data?.result ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-primary" />
              Structures de Prix Minier
            </h1>
            <p className="text-muted-foreground">Gestion des structures de prix officielles pour le secteur minier</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/prices/create">
              <Button>
                Nouvelle Structure
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Structures de Prix</CardTitle>
          <CardDescription>Visualisez et gérez toutes vos structures de prix pour le secteur minier</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable items={items} />
        </CardContent>
      </Card>
    </div>
  );
}


