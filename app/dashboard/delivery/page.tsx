import prisma from "@/lib/prisma";
import DataTablesWrapper from "./client-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Truck } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ depot?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const depotFilter = params.depot?.toLowerCase();
  const isLubumbashiView = depotFilter === "lubumbashi";
  const isKalemieView = depotFilter === "kalemie";

  const deliveries = await prisma.delivery.findMany({
    where: depotFilter
      ? {
          depot: {
            name: {
              contains: depotFilter,
              mode: "insensitive",
            },
          },
        }
      : undefined,
    orderBy: { deliveryDate: "desc" },
    include: {
      client: true,
      destinationClient: true,
      transporter: true,
      depot: true,
      produit: true,
      equipment: true,
    },
  });
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Truck className="h-8 w-8 text-primary" />
              {isLubumbashiView ? "DeliveryLBB" : "Livraisons"}
            </h1>
            <p className="text-muted-foreground">
              {isLubumbashiView
                ? "Gestion des sorties Delivery - Dépôt Lubumbashi"
                : isKalemieView
                ? "Gestion des sorties Delivery - Dépôt Kalemie"
                : "Gestion des livraisons"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/delivery/create${depotFilter ? `?depot=${depotFilter}` : ""}`}>
              <Button>
                {isLubumbashiView ? "Nouvelle DeliveryLBB" : "Nouvelle Livraison"}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Livraisons</CardTitle>
          <CardDescription>
            {isLubumbashiView
              ? "Visualisez et gérez les sorties Delivery du dépôt Lubumbashi"
              : "Visualisez et gérez toutes vos livraisons"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTablesWrapper Element={deliveries} />
        </CardContent>
      </Card>
    </div>
  );
}
