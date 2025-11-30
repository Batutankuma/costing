import prisma from "@/lib/prisma";
import DataTables from "./data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  // Récupérer les clients avec les relations
  const clients = await prisma.client.findMany({
    include: {
      owner: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" />
              Clients
            </h1>
            <p className="text-muted-foreground">Gestion des clients</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/clients/create">
              <Button>
                Nouveau Client
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tableau des données */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Clients</CardTitle>
          <CardDescription>
            Visualisez et gérez tous vos clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTables Element={clients as any} />
        </CardContent>
      </Card>
    </div>
  );
}


