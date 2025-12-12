import prisma from "@/lib/prisma";
import DataTables from "./data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PackageOpen } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  // Récupérer les produits
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <PackageOpen className="h-8 w-8 text-primary" />
              Produits
            </h1>
            <p className="text-muted-foreground">Gestion des produits</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/products/create">
              <Button>
                Nouveau Produit
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Produits</CardTitle>
          <CardDescription>
            Visualisez et gérez tous vos produits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTables Element={products} />
        </CardContent>
      </Card>
    </div>
  );
}


