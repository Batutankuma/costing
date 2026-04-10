import prisma from "@/lib/prisma";
import DataTablesWrapper from "./client-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Truck } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const deliveries = await prisma.delivery.findMany({ 
    orderBy: { deliveryDate: 'desc' },
    include: {
      client: true,
      depot: true,
      produit: true,
      equipment: true,
    }
  });
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Truck className="h-8 w-8 text-primary" />
              Livraisons
            </h1>
            <p className="text-muted-foreground">Gestion des livraisons</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/delivery/create">
              <Button>
                Nouvelle Livraison
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Livraisons</CardTitle>
          <CardDescription>
            Visualisez et gérez toutes vos livraisons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTablesWrapper Element={deliveries} />
        </CardContent>
      </Card>
    </div>
  );
}
