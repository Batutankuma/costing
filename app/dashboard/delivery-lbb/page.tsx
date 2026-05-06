import prisma from "@/lib/prisma";
import DataTablesWrapper from "../delivery/client-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Truck } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DeliveryLBBPage() {
  const [allDeliveries, clients, transporters, depots, products, clientOrders] = await Promise.all([
    prisma.delivery.findMany({
      orderBy: { deliveryDate: "desc" },
      include: {
        client: true,
        destinationClient: true,
        transporter: true,
        depot: true,
        produit: true,
        equipment: true,
      },
    }),
    prisma.client.findMany({
      select: { id: true, name: true, company: true },
      orderBy: { name: "asc" },
    }),
    prisma.transporteur.findMany({
      select: { id: true, nom: true },
      orderBy: { nom: "asc" },
    }),
    prisma.depot.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.clientOrder.findMany({
      select: {
        id: true,
        reference: true,
        clientId: true,
        produitId: true,
        unitPrice: true,
        client: { select: { name: true, company: true } },
        produit: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const isLubumbashiDepot = (name: string) => {
    const normalized = name.toLowerCase();
    return (
      normalized.includes("lubumbashi") ||
      normalized.includes("lubum") ||
      normalized.includes("lbb")
    );
  };
  const lubumbashiDepots = depots.filter((depot) => isLubumbashiDepot(depot.name));
  const lubumbashiDepotIds = new Set(lubumbashiDepots.map((depot) => depot.id));
  const deliveries =
    lubumbashiDepotIds.size > 0
      ? allDeliveries.filter((delivery) => delivery.depotId && lubumbashiDepotIds.has(delivery.depotId))
      : allDeliveries;
  const stockRefs = Array.from(
    new Set(
      deliveries.flatMap((delivery) => [
        delivery.reference || "",
        `Livraison ${delivery.id}`,
      ]).filter(Boolean),
    ),
  );
  const sortieStocks = stockRefs.length
    ? await prisma.stock.findMany({
        where: {
          type: "SORTIE",
          reference: { in: stockRefs },
        },
        select: {
          reference: true,
          prixUnitaireAchat: true,
        },
      })
    : [];
  const stockByReference = new Map(sortieStocks.map((stock) => [stock.reference, stock]));
  const deliveriesWithProfit = deliveries.map((delivery) => {
    const linkedStock =
      (delivery.reference ? stockByReference.get(delivery.reference) : undefined) ||
      stockByReference.get(`Livraison ${delivery.id}`);
    const quantity = Number(delivery.qOffloaded ?? delivery.quantity ?? 0);
    const saleUnitPrice = Number(delivery.prixUnitaire ?? 0);
    const purchaseUnitPrice = Number(linkedStock?.prixUnitaireAchat ?? 0);
    const saleTotal = quantity * saleUnitPrice;
    const purchaseTotal = quantity * purchaseUnitPrice;
    const profit = saleTotal - purchaseTotal;
    const profitMargin = saleTotal > 0 ? (profit / saleTotal) * 100 : 0;
    return {
      ...delivery,
      saleUnitPrice,
      purchaseUnitPrice,
      saleTotal,
      purchaseTotal,
      profit,
      profitMargin,
    };
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Truck className="h-8 w-8 text-primary" />
              DeliveryLBB
            </h1>
            <p className="text-muted-foreground">Gestion des sorties Delivery - Dépôt Lubumbashi</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/delivery-lbb/create">
              <Button>Nouvelle DeliveryLBB</Button>
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des DeliveryLBB</CardTitle>
          <CardDescription>Visualisez et gérez les sorties Delivery du dépôt Lubumbashi</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTablesWrapper
            Element={deliveriesWithProfit}
            templateOptions={{
              clients: clients.map((c) => ({ id: c.id, name: c.company || c.name })),
              transporters,
              // L'import doit proposer tous les dépôts dans la liste/template.
              depots,
              products: products.map((p) => ({ id: p.id, nom: p.name || "Produit" })),
              clientOrders: clientOrders.map((o) => ({
                id: o.id,
                reference: o.reference,
                clientId: o.clientId,
                produitId: o.produitId,
                unitPrice: Number(o.unitPrice || 0),
                clientName: o.client.company || o.client.name || "Client",
                productName: o.produit.name || "Produit",
              })),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

