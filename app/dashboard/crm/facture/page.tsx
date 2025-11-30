import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { findAllFacturesAction } from "./actions";
import FactureDataTable from "./data-table";
import { ManualFacture } from "@/models/mvc";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FacturePage() {
  const result = await findAllFacturesAction();
  const rawFactures = (result?.data?.result ?? []) as ManualFacture[];
  const factures = rawFactures.map((facture) => ({
    ...facture,
    invoiceDate: facture.invoiceDate instanceof Date ? facture.invoiceDate : new Date(facture.invoiceDate),
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Factures manuelles</h1>
          <p className="text-muted-foreground">Enregistrez et visualisez vos factures saisies manuellement.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/crm/facture/create" className="gap-2">
            <FilePlus2 className="h-4 w-4" />
            Nouvelle facture
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des factures</CardTitle>
          <CardDescription>Chaque ligne peut être consultée, modifiée ou supprimée.</CardDescription>
        </CardHeader>
        <CardContent>
          <FactureDataTable data={factures as any} />
        </CardContent>
      </Card>
    </div>
  );
}
