import { getProducts } from "@/app/dashboard/products/actions";
import { getFournisseurs } from "@/app/dashboard/fournisseurs/actions";
import { getClients } from "@/app/dashboard/clients/actions";
import prisma from "@/lib/prisma";
import EditStockForm from "../edit-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EditStockPage({ params }: { params: Promise<{ id: string }> }) {
  // Resolve params
  const resolvedParams = await params;
  const stockId = resolvedParams.id;

  // Charger les données depuis Prisma
  const [products, fournisseurs, clients, depots, stock] = await Promise.all([
    getProducts(),
    getFournisseurs(),
    getClients(),
    prisma.depot.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.stock.findUnique({ where: { id: stockId } }),
  ]);

  // Vérifier si le stock existe
  if (!stock) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/stocks">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Package className="h-8 w-8 text-primary" />
                Stock introuvable
              </h1>
            </div>
          </div>
        </div>
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Le stock demandé n'a pas été trouvé.</p>
        </div>
      </div>
    );
  }

  // Préparer les données pour le formulaire
  const productSuggestions = products.map((p: any) => ({ id: p.id, name: p.name, unit: p.unit }));
  const fournisseurSuggestions = fournisseurs.map((f: any) => ({ id: f.id, nom: f.nom }));
  const clientSuggestions = clients.map((c: any) => ({ id: c.id, name: c.name }));
  const depotSuggestions = depots.map((d: any) => ({ id: d.id, name: d.name }));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/stocks">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Package className="h-8 w-8 text-primary" />
              Modifier le Mouvement de Stock
            </h1>
            <p className="text-muted-foreground">Modifier les informations d'une entrée ou sortie de stock</p>
          </div>
        </div>
      </div>
      <EditStockForm
        initialStock={stock}
        productSuggestions={productSuggestions}
        fournisseurSuggestions={fournisseurSuggestions}
        clientSuggestions={clientSuggestions}
        depotSuggestions={depotSuggestions}
      />
    </div>
  );
}
