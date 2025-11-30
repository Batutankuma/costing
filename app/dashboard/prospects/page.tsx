import prisma from "@/lib/prisma";
import DataTables from "./data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  // Récupérer les prospects avec les relations
  const prospects = await prisma.prospect.findMany({
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
              Prospects
            </h1>
            <p className="text-muted-foreground">Gestion de votre pipeline commercial</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/prospects/create">
              <Button>
                Nouveau Prospect
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Tableau des données */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Prospects</CardTitle>
          <CardDescription>
            Visualisez et gérez tous vos prospects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTables Element={prospects as any} />
        </CardContent>
      </Card>
    </div>
  );
}










