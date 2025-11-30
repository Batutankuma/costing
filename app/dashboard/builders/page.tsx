import { listBuilders } from "./actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DataTable from "./data-table";
import { Calculator } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const res = await listBuilders();
  const items = (res as any)?.data?.result ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Calculator className="h-8 w-8 text-primary" />
              Cost Build Up Minier
            </h1>
            <p className="text-muted-foreground">Gestion des structures de coûts pour le secteur minier</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/builders/create">
              <Button>
                Nouveau Cost Build Up
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Cost Build Ups</CardTitle>
          <CardDescription>
            Visualisez et gérez tous vos cost build ups pour le secteur minier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable items={items} />
        </CardContent>
      </Card>
    </div>
  );
}


