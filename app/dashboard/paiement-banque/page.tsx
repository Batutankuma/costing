import prisma from "@/lib/prisma";
import DataTables from "./data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CreditCard } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const paiements = await prisma.paiementBanque.findMany({
    include: {
      commande: {
        select: { reference: true, id: true }
      },
      banque: {
        select: { nom: true, id: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <CreditCard className="h-8 w-8 text-primary" />
              Paiements Banque
            </h1>
            <p className="text-muted-foreground">Gestion des paiements à la banque</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/paiement-banque/create">
              <Button>
                Nouveau Paiement
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Paiements Banque</CardTitle>
          <CardDescription>
            Visualisez et gérez tous vos paiements à la banque
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTables Element={paiements} />
        </CardContent>
      </Card>
    </div>
  );
}
