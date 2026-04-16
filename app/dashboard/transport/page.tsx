import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck } from "lucide-react";
import DataTables from "./data-table";
import type { TransporteurWithRelations } from "./columns";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TransportPage() {
  const transporteurs = await prisma.transporteur.findMany({
    orderBy: { createdAt: "desc" },
  }) as TransporteurWithRelations[];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Truck className="h-8 w-8 text-primary" />
              Transporteurs
            </h1>
            <p className="text-muted-foreground">Gestion des transporteurs</p>
          </div>
          <Link href="/dashboard/transport/create">
            <Button>Nouveau Transporteur</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des transporteurs</CardTitle>
          <CardDescription>Visualisez et gérez vos transporteurs.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTables Element={transporteurs} />
        </CardContent>
      </Card>
    </div>
  );
}
