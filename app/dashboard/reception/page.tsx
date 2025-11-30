import prisma from "@/lib/prisma";
import DataTables from "./data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PackageCheck } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  // Récupérer les réceptions avec les relations
  const receptions = await (prisma as any).reception.findMany({
    include: {
      commande: {
        select: {
          reference: true,
          quantite: true,
          status: true,
        }
      },
      produit: {
        select: {
          name: true,
        }
      },
      tank: {
        select: {
          name: true,
        }
      },
    },
    orderBy: { receptionDate: 'desc' }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <PackageCheck className="h-8 w-8 text-primary" />
              Réceptions
            </h1>
            <p className="text-muted-foreground">Gestion des réceptions</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/reception/create">
              <Button>
                Nouvelle Réception
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Réceptions</CardTitle>
          <CardDescription>
            Visualisez et gérez toutes vos réceptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTables Element={receptions as any} />
        </CardContent>
      </Card>
    </div>
  );
}
