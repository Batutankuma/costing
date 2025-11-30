import Link from "next/link";
import { listKalemieBuilders } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import DataTable from "./data-table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function KalemieBuildersPage() {
  const res = await listKalemieBuilders();
  const items = (res as any)?.result ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              Build-Const Kalemie
            </h1>
            <p className="text-muted-foreground">Gestion des coûts de construction pour Kalemie</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/build-const-kalemie/create">
              <Button>
                Nouvelle Construction
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Constructions Kalemie</CardTitle>
          <CardDescription>Visualisez et gérez toutes les structures de coûts pour Kalemie</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable items={items} />
        </CardContent>
      </Card>
    </div>
  );
}








