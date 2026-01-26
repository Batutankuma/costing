import prisma from "@/lib/prisma";
import DataTables from "./data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Truck } from "lucide-react";
import DownloadTemplate from "./components/download-template";
import ImportExcel from "./components/import-excel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  // Récupérer les shipments avec les relations
  const shipments = await prisma.shipment.findMany({
    include: {
      client: {
        select: {
          id: true,
          name: true,
          company: true,
        },
      },
      produit: {
        select: {
          id: true,
          name: true,
          unit: true,
        },
      },
      depot: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Truck className="h-8 w-8 text-primary" />
              Livraisons (Shipments)
            </h1>
            <p className="text-muted-foreground">Gestion des livraisons</p>
          </div>
          <div className="flex gap-2">
            <DownloadTemplate />
            <ImportExcel />
            <Link href="/dashboard/shipments/create">
              <Button>
                Nouvelle Livraison
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tableau des données */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Livraisons</CardTitle>
          <CardDescription>
            Visualisez et gérez toutes vos livraisons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTables Element={shipments} />
        </CardContent>
      </Card>
    </div>
  );
}

