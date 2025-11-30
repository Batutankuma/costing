import prisma from "@/lib/prisma";
import DataTables from "./data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Truck } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  // Récupérer les tarifs de transport
  const transportRates = await prisma.transportRate.findMany({
    orderBy: { destination: 'asc' }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Truck className="h-8 w-8 text-primary" />
              Tarifs de Transport
            </h1>
            <p className="text-muted-foreground">Gestion des tarifs de transport par destination</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/transport-rates/create">
              <Button>
                Nouveau Tarif
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Tarifs de Transport</CardTitle>
          <CardDescription>Visualisez et gérez tous vos tarifs de transport (USD/CBM)</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTables Element={transportRates as any} />
        </CardContent>
      </Card>
    </div>
  );
}

