import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getClients } from "./actions";
import { ClientsDataTable } from "./data-table";

async function ClientsTable() {
  const items = await getClients();
  return <ClientsDataTable data={items as any} />;
}

export default function ClientsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground">Gestion des clients</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/clients/create">
              <Button>Nouveau Client</Button>
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Clients</CardTitle>
          <CardDescription>Visualisez et gérez vos clients</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Chargement...</div>}>
            <ClientsTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}


