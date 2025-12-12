import prisma from "@/lib/prisma";
import DataTables from "./data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Building2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  // Récupérer les fournisseurs
  const fournisseurs = await prisma.fournisseur.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              Fournisseurs
            </h1>
            <p className="text-muted-foreground">Gestion des fournisseurs</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/fournisseurs/create">
              <Button>
                Nouveau Fournisseur
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Fournisseurs</CardTitle>
          <CardDescription>Visualisez et gérez tous vos fournisseurs</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTables Element={fournisseurs} />
        </CardContent>
      </Card>
    </div>
  );
}

