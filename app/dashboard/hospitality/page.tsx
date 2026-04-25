import prisma from "@/lib/prisma";
import DataTables from "./data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Truck } from "lucide-react";
import type { HospitalityWithRelations } from "./columns";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HospitalityPage() {
  const [data, suppliers, transporters, depots, commandes] = await Promise.all([
    prisma.hospitality.findMany({
      include: {
        supplier: { select: { id: true, nom: true } },
        transporter: { select: { id: true, nom: true } },
        depot: { select: { id: true, name: true } },
        commande: { select: { id: true, reference: true } },
      },
      orderBy: { createdAt: "desc" },
    }) as Promise<HospitalityWithRelations[]>,
    prisma.fournisseur.findMany({ select: { id: true, nom: true }, orderBy: { nom: "asc" } }),
    prisma.transporteur.findMany({ select: { id: true, nom: true }, orderBy: { nom: "asc" } }),
    prisma.depot.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.commande.findMany({
      where: { quantite: { gt: 0 } },
      select: { id: true, reference: true, depotId: true },
      orderBy: { reference: "asc" },
    }),
  ]);

  const templateOptions = {
    suppliers,
    transporters,
    depots,
    commandes,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Truck className="h-8 w-8 text-primary" />
              Hospitality - Depot Lubumbashi
            </h1>
            <p className="text-muted-foreground">Gestion des lignes hospitality</p>
          </div>
          <Link href="/dashboard/hospitality/create">
            <Button>Nouvelle ligne</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste hospitality</CardTitle>
          <CardDescription>Visualisez et gérez les données du tableau transport/hospitality.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTables Element={data} templateOptions={templateOptions} />
        </CardContent>
      </Card>
    </div>
  );
}
