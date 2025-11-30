import prisma from "@/lib/prisma";
import DataTablesWrapper from "./client-wrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  try {
    // Récupérer toutes les commandes avec les relations
    const Commande = await prisma.commande.findMany({
      include: {
        produit: true,
        depot: true,
        fournisseur: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <ShoppingCart className="h-8 w-8 text-primary" />
              Commandes
            </h1>
            <p className="text-muted-foreground">Gestion des commandes</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/commande/create">
              <Button>
                Nouvelle Commande
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Commandes</CardTitle>
          <CardDescription>
            Visualisez et gérez toutes vos commandes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTablesWrapper Element={Commande || []} />
        </CardContent>
      </Card>
    </div>
  );
  } catch (error) {
    console.error('Erreur générale:', error);
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-red-600 mb-4">Erreur inattendue</h1>
          <p className="text-gray-600">Une erreur inattendue s'est produite lors du chargement de la page.</p>
          <p className="text-sm text-gray-500 mt-2">Veuillez réessayer ou contacter l'administrateur.</p>
        </div>
      </div>
    );
  }
}
