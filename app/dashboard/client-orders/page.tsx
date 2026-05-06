import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DataTables from "./data-table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ClientOrdersPage() {
  const rows = await prisma.clientOrder.findMany({
    include: {
      client: { select: { name: true, company: true } },
      produit: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const references = rows.map((row) => row.reference).filter(Boolean);
  const deliveries = references.length
    ? await prisma.delivery.findMany({
        where: { commandNumber: { in: references } },
        select: { commandNumber: true, qOffloaded: true, quantity: true },
      })
    : [];
  const receivedByReference = new Map<string, number>();
  for (const delivery of deliveries) {
    const key = delivery.commandNumber || "";
    if (!key) continue;
    const qty = Number(delivery.qOffloaded ?? delivery.quantity ?? 0);
    receivedByReference.set(key, Number(receivedByReference.get(key) || 0) + qty);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bon de commande client</h1>
          <p className="text-muted-foreground">Commandes clients et prix unitaires de reference</p>
        </div>
        <Link href="/dashboard/client-orders/create">
          <Button>Nouveau bon client</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des bons de commande client</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTables
            Element={rows.map((row) => {
              const orderedQty = Number(row.quantity || 0);
              const receivedQty = Number(receivedByReference.get(row.reference) || 0);
              const remainingQty = Math.max(0, orderedQty - receivedQty);
              const reliquat = remainingQty;
              const loss = Math.max(0, receivedQty - orderedQty);
              return {
                ...row,
                orderedQty,
                receivedQty,
                remainingQty,
                reliquat,
                perte: loss,
              };
            })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
