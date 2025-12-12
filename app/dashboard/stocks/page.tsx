import prisma from "@/lib/prisma";
import DataTables from "./data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, Package } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  // Récupérer les stocks avec les relations
  const stocks = await prisma.stock.findMany({
    include: {
      depot: true,
      produit: true,
      client: true,
      fournisseur: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  // Récupérer les dépôts pour le mini dashboard
  const depots = await prisma.depot.findMany({
    select: { id: true, name: true }
  });

  // Récupérer les commandes pour les calculs
  const commandes = await prisma.commande.findMany({
    select: {
      id: true,
      produitId: true,
      depotId: true,
      fournisseurId: true,
      unitPrice: true,
      fournisseur: {
        select: { nom: true }
      }
    }
  });

  // Calculer les statistiques
  const totalStocks = stocks.length;
  const entrees = stocks.filter(s => s.type === 'ENTREE').length;
  const sorties = stocks.filter(s => s.type === 'SORTIE').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Package className="h-8 w-8 text-primary" />
              Stocks
            </h1>
            <p className="text-muted-foreground">Gestion des mouvements de stock</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/stocks/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Mouvement
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mouvements</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStocks}</div>
            <p className="text-xs text-muted-foreground">
              Tous les mouvements confondus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entrées</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{entrees}</div>
            <p className="text-xs text-muted-foreground">
              Réceptions de stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sorties</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{sorties}</div>
            <p className="text-xs text-muted-foreground">
              Livraisons de stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mini dashboard: quantités par dépôt */}
      {depots.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Quantités par Dépôt</CardTitle>
            <CardDescription>Vue d&apos;ensemble des stocks par dépôt</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {depots.map((d) => {
                const depotStocks = stocks.filter((s) => s.depotId === d.id);
                const entrees = depotStocks
                  .filter((s) => s.type === 'ENTREE')
                  .reduce((acc, s) => acc + (Number(s.quantite) || 0), 0);
                const sorties = depotStocks
                  .filter((s) => s.type === 'SORTIE')
                  .reduce((acc, s) => acc + (Number(s.quantite) || 0), 0);
                const stockFinal = entrees - sorties;
                return (
                  <div key={d.id} className="rounded border p-4">
                    <div className="text-sm text-muted-foreground">{d.name}</div>
                    <div className="text-xl font-semibold">{stockFinal.toLocaleString("fr-FR")}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tableau des données */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Mouvements de Stock</CardTitle>
          <CardDescription>
            Visualisez et gérez tous vos mouvements de stock (entrées et sorties)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTables Element={stocks} Depots={depots} Commandes={commandes} />
        </CardContent>
      </Card>
    </div>
  );
}
