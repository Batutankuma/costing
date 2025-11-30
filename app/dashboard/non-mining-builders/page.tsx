import { getNonMiningBuilders } from "./actions";
import { NonMiningBuildersDataTable } from "./data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NonMiningBuildersPage() {
  const builders = await getNonMiningBuilders();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Calculator className="h-8 w-8 text-primary" />
              Cost Build Up Non-Minier
            </h1>
            <p className="text-muted-foreground">
              Gestion des structures de coûts pour les produits non-miniers
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/non-mining-builders/create">
              <Button>
                Nouveau Cost Build Up
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Cost Build Ups Non-Minier</CardTitle>
          <CardDescription>
            Visualisez et gérez tous vos cost build ups pour les produits non-miniers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NonMiningBuildersDataTable data={builders} />
        </CardContent>
      </Card>
    </div>
  );
}
