import prisma from "@/lib/prisma";
import DataTables from "./data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Fuel } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const data = await prisma.tank.findMany({ 
    orderBy: { createdAt: 'desc' },
    include: {
      depot: true,
      produit: true
    }
  });
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Fuel className="h-8 w-8 text-primary" />
              Tanks
            </h1>
            <p className="text-muted-foreground">Gestion des tanks</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/tank/create">
              <Button>
                Nouveau Tank
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Tanks</CardTitle>
          <CardDescription>
            Visualisez et gérez tous vos tanks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTables Element={data || []} />
        </CardContent>
      </Card>
    </div>
  );
}
