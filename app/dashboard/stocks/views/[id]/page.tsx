"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Edit, Package, Warehouse, Users, Calculator, DollarSign, TrendingUp, FileText, Calendar, Hash } from "lucide-react";
import { findByIdAction } from "../../actions";
import Link from "next/link";

type StockWithRelations = {
  id: string;
  date: Date;
  reference: string;
  type: 'ENTREE' | 'SORTIE';
  quantite: number;
  unite: string;
  devise: string;
  prixUnitaireAchat?: number | null;
  prixUnitaireVente?: number | null;
  seuilMinimum: number;
  depotId?: string | null;
  produitId: string;
  fournisseurId?: string | null;
  clientId?: string | null;
  valeurEntree?: number | null;
  valeurSortie?: number | null;
  stockQuantiteFinal?: number | null;
  stockPrixUnitaireFinal?: number | null;
  stockValeurFinal?: number | null;
  createdAt: Date;
  updatedAt: Date;
  depot?: { id: string; name: string; type: string } | null;
  produit?: { id: string; name: string; unit: string } | null;
  fournisseur?: { id: string; nom: string } | null;
  client?: { id: string; name: string } | null;
};

function isHospitalityMovement(reference: string) {
  return reference.startsWith("HOSP-");
}

export default function ViewStocksPage() {
  const [stockId, setStockId] = useState<string | null>(null);
  const [stock, setStock] = useState<StockWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params && params.id) {
      setStockId(params.id as string);
    } else {
      setError("ID du stock manquant dans les paramètres de l'URL.");
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    if (!stockId) return;

    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    async function fetchStock() {
      setLoading(true);
      setError(null);
      
      // Timeout de sécurité : si le chargement prend plus de 8 secondes, forcer l'arrêt
      timeoutId = setTimeout(() => {
        if (isMounted) {
          setLoading(false);
          setError("Le chargement prend trop de temps. Veuillez réessayer.");
        }
      }, 8000);

      try {
        const result = await findByIdAction(stockId!);
        
        if (!isMounted) return;
        
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        if (result.success && result.result) {
          setStock(result.result as StockWithRelations); 
        } else if (result.failure) {
          setError(result.failure);
          toast({ variant: "destructive", title: "Erreur", description: result.failure });
        } else {
          setError("Stock non trouvé.");
          toast({ variant: "destructive", title: "Erreur", description: "Stock non trouvé." });
        }
      } catch (err) {
        if (!isMounted) return;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        const errorMessage = err instanceof Error ? err.message : "Une erreur inattendue s'est produite lors du chargement des données.";
        setError(errorMessage);
        toast({ variant: "destructive", title: "Erreur", description: "Échec du chargement des données." });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchStock();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [stockId]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
            <p className="mt-2 text-gray-500">Chargement des détails...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="text-destructive bg-destructive/10 p-4 rounded-md">
              <p className="font-medium">{error}</p>
            </div>
            <Button variant="outline" className="mt-4" onClick={() => router.push(`/dashboard/stocks`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-700">Aucune donnée stock disponible pour cet ID.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push(`/dashboard/stocks`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (value: number | null | undefined, currency: string = stock.devise) => {
    if (value == null) return "N/A";
    return `${Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${currency}`;
  };
  const fromHospitality = isHospitalityMovement(stock.reference);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Détails du Mouvement de Stock
          </h1>
          <p className="text-muted-foreground mt-1">
            Informations détaillées sur le mouvement de stock
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/stocks/${stock.id}`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </Link>
          <Button variant="outline" onClick={() => router.push(`/dashboard/stocks`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
        </div>
      </div>

      {/* Informations principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informations Générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Référence</Label>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  {stock.reference}
                  {fromHospitality ? (
                    <Badge variant="outline">Hospitality</Badge>
                  ) : null}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Date</Label>
                <p className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {new Date(stock.date).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Type</Label>
                <div className="mt-1">
                  <Badge variant={stock.type === 'ENTREE' ? 'default' : 'secondary'}>
                    {stock.type === 'ENTREE' ? 'Entrée' : 'Sortie'}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Quantité</Label>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                  {stock.quantite.toLocaleString('fr-FR')} {stock.unite}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produit et Dépôt
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Produit</Label>
              <p className="text-lg font-semibold">
                {stock.produit?.name || stock.produitId || "N/A"}
              </p>
              {stock.produit && (
                <p className="text-sm text-muted-foreground">Unité: {stock.produit.unit}</p>
              )}
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Dépôt</Label>
              <p className="text-lg font-semibold flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-muted-foreground" />
                {stock.depot?.name || stock.depotId || "N/A"}
              </p>
              {stock.depot && (
                <Badge variant="outline" className="mt-1">
                  {stock.depot.type === 'OWNED' ? 'Interne' : 'Externe'}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fournisseur ou Client */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {stock.type === 'ENTREE' ? 'Fournisseur' : 'Client'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stock.type === 'ENTREE' ? (
            <p className="text-lg font-semibold">
              {stock.fournisseur?.nom || stock.fournisseurId || "Aucun fournisseur"}
            </p>
          ) : (
            <p className="text-lg font-semibold">
              {stock.client?.name || stock.clientId || "Aucun client"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Informations financières */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Prix et Valeurs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Prix Unitaire Achat (CMP)</Label>
                <p className="text-lg font-semibold">
                  {formatCurrency(stock.prixUnitaireAchat)}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Prix Unitaire Vente</Label>
                <p className="text-lg font-semibold">
                  {formatCurrency(stock.prixUnitaireVente)}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Devise</Label>
                <p className="text-lg">{stock.devise}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Valeur Entrée</Label>
                <p className="text-lg font-semibold text-green-600">
                  {formatCurrency(stock.valeurEntree)}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Valeur Sortie</Label>
                <p className="text-lg font-semibold text-orange-600">
                  {formatCurrency(stock.valeurSortie)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Stock Final (CMP)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Quantité Stock Final</Label>
                <p className="text-lg font-semibold">
                  {stock.stockQuantiteFinal != null 
                    ? `${stock.stockQuantiteFinal.toLocaleString('fr-FR')} ${stock.unite}`
                    : "N/A"}
                </p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Prix Unitaire Final (PUMP)</Label>
                <p className="text-lg font-semibold">
                  {formatCurrency(stock.stockPrixUnitaireFinal)}
                </p>
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm text-muted-foreground">Valeur Stock Final</Label>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(stock.stockValeurFinal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informations supplémentaires */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Supplémentaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-muted-foreground">Seuil Minimum</Label>
              <p className="text-lg">{stock.seuilMinimum.toLocaleString('fr-FR')} {stock.unite}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Date de Création</Label>
              <p className="text-sm text-gray-600">
                {new Date(stock.createdAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Dernière Mise à Jour</Label>
              <p className="text-sm text-gray-600">
                {new Date(stock.updatedAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
