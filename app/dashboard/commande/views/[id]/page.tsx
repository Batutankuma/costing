'use client';

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { z } from "zod";

import { CommandeSchema } from "@/models/mvc"; 

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { findByIdAction } from "../../actions"; // Importe l'action du serveur
// Fallback simple print button if the shared component is missing
const PrintButton = () => {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center px-3 py-1 border rounded-md"
    >
      Imprimer
    </button>
  );
};

type CommandeData = z.infer<typeof CommandeSchema>;

export default function ViewCommandePage() {
  const [commandeId, setCommandeId] = useState<string | null>(null);
  const [commande, setCommande] = useState<CommandeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params && params.id) {
      setCommandeId(params.id as string);
    } else {
      setError("Commande ID is missing from URL parameters.");
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    if (!commandeId) return;

    async function fetchCommande() {
      setLoading(true);
      setError(null);
      try {
        const result = await findByIdAction(commandeId!);
        if ((result as any).success && (result as any).result) {
          setCommande((result as any).result as CommandeData); 
        } else if ((result as any).failure) {
          setError((result as any).failure);
          toast({ variant: "destructive", title: "Error", description: (result as any).failure });
        } else {
          setError("Commande not found.");
          toast({ variant: "destructive", title: "Error", description: "Commande not found." });
        }
      } catch {
        setError("An unexpected error occurred while loading data.");
        toast({ variant: "destructive", title: "Error", description: "Failed to load data." });
      } finally {
        setLoading(false);
      }
    }

    fetchCommande();
  }, [commandeId, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">{error}</p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/dashboard/operations/commande`)}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  if (!commande) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <p className="text-gray-700">Aucune donnée commande disponible pour cet ID.</p>
        <Button variant="outline" onClick={() => router.push(`/dashboard/operations/commande`)}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Détails de la Commande</CardTitle>
          <CardDescription>
            Informations détaillées sur la commande.
          </CardDescription>
          <div className="mt-2"><PrintButton /></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="reference">Référence</Label>
              <p id="reference" className="text-lg font-semibold">{commande.reference}</p>
            </div>

            <div>
              <Label htmlFor="status">Statut</Label>
              <p id="status" className="text-lg">
                {commande.status === "DRAFT" && "Brouillon"}
                {commande.status === "CONFIRMED" && "Confirmé"}
                {commande.status === "COMPLETED" && "Terminé"}
                {commande.status === "CANCELLED" && "Annulé"}
              </p>
            </div>

            <div>
              <Label htmlFor="produitId">Produit</Label>
              <p className="text-lg">{(commande as any).Produit?.nom ?? (commande as any).produitId}</p>
            </div>

            <div>
              <Label htmlFor="depotId">Dépôt</Label>
              <p className="text-lg">{(commande as any).Depot?.name ?? (commande as any).depotId}</p>
            </div>

            <div>
              <Label htmlFor="fournisseurId">Fournisseur</Label>
              <p className="text-lg">{(commande as any).Fournisseur?.nom ?? (commande as any).fournisseurId}</p>
            </div>

            <div>
              <Label htmlFor="devise">Devise</Label>
              <p id="devise" className="text-lg">{commande.devise}</p>
            </div>

            <div>
              <Label htmlFor="currentQuantity">Quantité Actuelle</Label>
              <p id="currentQuantity" className="text-lg">{(commande as any).currentQuantity}</p>
            </div>

            <div>
              <Label htmlFor="quantity">Quantité Totale</Label>
              <p id="quantity" className="text-lg">
                {(commande as any).quantite ?? (commande as any).quantity ?? "N/A"}
              </p>
            </div>

            <div>
              <Label htmlFor="unitPrice">Prix Unitaire</Label>
              <p id="unitPrice" className="text-lg">{commande.unitPrice}</p>
            </div>

            <div>
              <Label htmlFor="typePaiement">Type de Paiement</Label>
              <p id="typePaiement" className="text-lg">
                {((commande as any).typePaiement ?? "").toUpperCase() === "DIRECT" ? "Direct" : "Crédit"}
              </p>
            </div>

            <div className="md:col-span-2">
              <Label>Date de Création</Label>
              <p className="text-sm text-gray-600">
                { (commande as any).createdAt ? new Date((commande as any).createdAt).toLocaleDateString('fr-FR', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                }) : "N/A"}
              </p>
            </div>

            <div className="md:col-span-2">
              <Label>Dernière Mise à Jour</Label>
              <p className="text-sm text-gray-600">
                { (commande as any).updatedAt ? new Date((commande as any).updatedAt).toLocaleDateString('fr-FR', {
                  year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                }) : "N/A"}
              </p>
            </div>

            <div className="md:col-span-2 flex justify-end gap-2">
              <Button variant="outline" onClick={() => router.push(`/dashboard/operations/commande`)}>
                Retour à la liste
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}