import prisma from "@/lib/prisma";
import DataTables from "./data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Warehouse, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function Page() {
  const data = await prisma.depot.findMany({
    orderBy: { createdAt: 'desc' },
    include: { products: { include: { product: true } } },
  });
  
  return (
    <div className="p-6 space-y-6">
      {/* Header avec titre et bouton de création */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Warehouse className="h-8 w-8 text-primary" />
            Gestion des Dépôts
          </h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos dépôts internes et externes
          </p>
        </div>
        
        <Link href="/dashboard/depots/create">
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nouveau Dépôt
          </Button>
        </Link>
      </div>

      {/* Tableau des données */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Dépôts</CardTitle>
          <CardDescription>
            Consultez, modifiez et gérez tous vos dépôts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTables Element={data || []} />
        </CardContent>
      </Card>
    </div>
  );
}
