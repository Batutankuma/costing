import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { getProspects } from "./actions";
import { ProspectsDataTable } from "./data-table";

async function ProspectsTable() {
  const items = await getProspects();
  return <ProspectsDataTable data={items} />;
}

export default function ProspectsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Prospects</h1>
            <p className="text-muted-foreground">Gestion de votre pipeline commercial</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/prospects/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Prospect
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline Commercial</CardTitle>
          <CardDescription>Suivez l'avancement de vos prospects</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center py-8 text-muted-foreground">Chargement...</div>}>
            <ProspectsTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}










