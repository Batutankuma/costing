import { getProducts } from "@/app/dashboard/products/actions";
import { getFournisseurs } from "@/app/dashboard/fournisseurs/actions";
import { getClients } from "@/app/dashboard/clients/actions";
import prisma from "@/lib/prisma";
import StockCreateForm from "./stock-create-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CreateStockPage() {
  // Charger les données depuis Prisma
  const [products, fournisseurs, clients, depots, commandes] = await Promise.all([
    getProducts(),
    getFournisseurs(),
    getClients(),
    prisma.depot.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.commande.findMany({
      select: {
        id: true,
        reference: true,
        status: true,
        depotId: true,
        produitId: true,
        fournisseurId: true,
        fournisseur: { select: { nom: true } },
        quantite: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Préparer les données pour le formulaire
  type ProductRef = { id: string; name: string; unit: string };
  type FournisseurRef = { id: string; nom: string };
  type ClientRef = { id: string; name: string };
  type DepotRef = { id: string; name: string };
  type CommandeRef = {
    id: string;
    reference: string;
    status: string;
    depotId: string | null;
    produitId: string | null;
    fournisseurId: string | null;
    fournisseur: { nom: string } | null;
    quantite: number;
  };
  const productSuggestions = products.map((p: ProductRef) => ({ id: p.id, name: p.name, unit: p.unit }));
  const fournisseurSuggestions = fournisseurs.map((f: FournisseurRef) => ({ id: f.id, nom: f.nom }));
  const clientSuggestions = clients.map((c: ClientRef) => ({ id: c.id, name: c.name }));
  const depotSuggestions = depots.map((d: DepotRef) => ({ id: d.id, name: d.name }));
  const commandeSuggestions = commandes.map((commande: CommandeRef) => ({
    id: commande.id,
    reference: commande.reference,
    status: commande.status,
    depotId: commande.depotId,
    produitId: commande.produitId,
    fournisseurId: commande.fournisseurId,
    fournisseurNom: commande.fournisseur?.nom ?? null,
    quantite: commande.quantite,
  }));

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
              Nouveau Mouvement de Stock
            </h1>
            <p className="text-muted-foreground">Créer une nouvelle entrée ou sortie de stock</p>
          </div>
        </div>
      </div>
      <StockCreateForm
        productSuggestions={productSuggestions}
        fournisseurSuggestions={fournisseurSuggestions}
        clientSuggestions={clientSuggestions}
        depotSuggestions={depotSuggestions}
        commandeSuggestions={commandeSuggestions}
      />
    </div>
  );
}
