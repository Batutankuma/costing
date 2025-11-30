"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useParams, useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { findByIdAction } from "../../actions";
import { Reception } from "@/models/mvc";

// Types locaux
type CommandeRef = { id: string; reference?: string | null; quantite?: number; quantity?: number; unit?: string | null; currentQuantity?: number; status?: string };
type ProduitRef = { id: string; name: string };
type TankRef = { id: string; name: string };
import { 
  ArrowLeft, 
  Edit, 
  Package, 
  Scale, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  List
} from "lucide-react";
import DeleteReception from "../../delete";

// Import des actions pour récupérer les données liées
import { findAllAction as findAllCommandes } from "@/app/dashboard/commande/actions";
import { listProducts } from "@/app/dashboard/products/actions";
import { findAllAction as findAllTanks } from "@/app/dashboard/tank/actions";

export default function ViewReceptionPage() {
  const params = useParams();
  const receptionId = params.id as string;
  const router = useRouter();
  
  const [reception, setReception] = useState<Reception | null>(null);
  const [commande, setCommande] = useState<CommandeRef | null>(null);
  const [produit, setProduit] = useState<ProduitRef | null>(null);
  const [tank, setTank] = useState<TankRef | null>(null);
  const [loading, setLoading] = useState(true);


  const { executeAsync: executeCommandes } = useAction(findAllCommandes);
  const { executeAsync: executeProduits } = useAction(listProducts);
  const { executeAsync: executeTanks } = useAction(findAllTanks);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Charger la réception
        const receptionResult = await findByIdAction(receptionId);
        if (receptionResult?.success && receptionResult.result) {
          const receptionData = receptionResult.result;
          setReception(receptionData);
          
          // Charger les données liées
          if (receptionData.commandeId) {
            const commandesResult = await executeCommandes();
            if (commandesResult?.data?.success && commandesResult.data.result) {
              const foundCommande = commandesResult.data.result.find((c: any) => c.id === receptionData.commandeId);
              setCommande(foundCommande || null);
            }
          }
          
          if (receptionData.produitId) {
            const produitsResult = await executeProduits();
            const produits = (produitsResult as any)?.data?.data ?? [];
            if (produits.length > 0) {
              const foundProduit = produits.find((p: any) => p.id === receptionData.produitId);
              setProduit(foundProduit || null);
            }
          }
          
          if (receptionData.tankId) {
            const tanksResult = await executeTanks();
            if (tanksResult?.data?.success && tanksResult.data.result) {
              const foundTank = tanksResult.data.result.find((t: any) => t.id === receptionData.tankId);
              setTank(foundTank || null);
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setLoading(false);
      }
    };

    if (receptionId) {
      loadData();
    }
  }, [receptionId, executeCommandes, executeProduits, executeTanks]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "RECEIVED": return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "IN_TRANSIT": return <Clock className="h-5 w-5 text-yellow-600" />;
      case "CANCELLED": return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "RECEIVED": return "Reçue";
      case "IN_TRANSIT": return "En transit";
      case "CANCELLED": return "Annulée";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "RECEIVED": return "default";
      case "IN_TRANSIT": return "outline";
      case "CANCELLED": return "destructive";
      default: return "outline";
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Chargement des détails...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!reception) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-600">Réception non trouvée</h2>
          <p className="text-gray-600 mt-2">La réception que vous recherchez n&apos;existe pas.</p>
          <Button 
            className="mt-4" 
            onClick={() => router.push('/dashboard/operations/reception')}
          >
            Retour aux réceptions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête avec navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/operations/reception')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Détails de la Réception</h1>
            <p className="text-muted-foreground">
              {reception.reference || `Réception ${reception.id.slice(0, 8)}...`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => router.push('/dashboard/operations/reception/list')}
          >
            <List className="h-4 w-4 mr-2" />
            Voir la liste
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push(`/dashboard/operations/reception/${reception.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <DeleteReception 
            receptionId={reception.id}
            receptionReference={reception.reference || `Réception ${reception.id.slice(0, 8)}...`}
            onDelete={() => router.push('/dashboard/operations/reception')}
          />
        </div>
      </div>

      {/* Informations principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Statut et informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(reception.receptionStatus)}
              Statut de la réception
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Statut actuel :</span>
              <Badge variant={getStatusColor(reception.receptionStatus) as "default" | "destructive" | "outline"}>
                {getStatusText(reception.receptionStatus)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Date de réception :</span>
              <span className="text-sm">
                {new Date(reception.receptionDate).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Heure :</span>
              <span className="text-sm">
                {new Date(reception.receptionDate).toLocaleTimeString('fr-FR')}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Quantité et unité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Détails de la réception
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Quantité reçue :</span>
              <span className="text-lg font-bold text-blue-600">
                {reception.quantity} {reception.unit}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Unité de mesure :</span>
              <Badge variant="outline">{reception.unit}</Badge>
            </div>
            {reception.notes && (
              <div className="pt-2 border-t">
                <span className="text-sm font-medium">Notes :</span>
                <p className="text-sm text-muted-foreground mt-1">{reception.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Référence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Référence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-2xl font-mono font-bold text-gray-800">
                {reception.reference || `Réception ${reception.id.slice(0, 8)}...`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {reception.reference ? "Référence personnalisée" : "Référence automatique"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informations détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Commande associée */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Commande associée
            </CardTitle>
          </CardHeader>
          <CardContent>
            {commande ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Référence :</span>
                  <span className="font-mono text-sm">{commande.reference}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Quantité commandée :</span>
                  <span className="font-semibold">{commande.quantite ?? commande.quantity ?? 0} {commande.unit || 'unités'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Quantité restante :</span>
                  <span className={`font-semibold ${
                    commande.currentQuantity === 0 ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {commande.currentQuantity} {commande.unit || 'unités'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Statut :</span>
                  <Badge variant="outline">{commande.status}</Badge>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progression de réception</span>
                    <span>{(() => {
                      const total = commande.quantite ?? commande.quantity ?? 0;
                      const remaining = commande.currentQuantity ?? 0;
                      return total > 0 ? (((total - remaining) / total) * 100).toFixed(1) : '0';
                    })()}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(() => {
                        const total = commande.quantite ?? commande.quantity ?? 0;
                        const remaining = commande.currentQuantity ?? 0;
                        return total > 0 ? ((total - remaining) / total) * 100 : 0;
                      })()}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                Aucune commande associée
              </div>
            )}
          </CardContent>
        </Card>

        {/* Produit et Tank */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produit et Stockage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Produit */}
            <div>
              <h4 className="text-sm font-medium mb-2">Produit reçu</h4>
              {produit ? (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium">{produit.nom}</div>
                  {produit.description && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {produit.description}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-2">
                  Produit non trouvé
                </div>
              )}
            </div>

            {/* Tank */}
            <div>
              <h4 className="text-sm font-medium mb-2">Tank de stockage</h4>
              {tank ? (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="font-medium">{tank.name}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Capacité : {tank.capacity} {tank.unit}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Niveau actuel : {tank.currentLevel} {tank.unit}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-2">
                  Aucun tank associé
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>
            Accédez rapidement aux fonctionnalités principales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={() => router.push(`/dashboard/operations/reception/${reception.id}`)}
              className="flex-1 md:flex-none"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier cette réception
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/dashboard/operations/reception/create')}
              className="flex-1 md:flex-none"
            >
              <Package className="h-4 w-4 mr-2" />
              Créer une nouvelle réception
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/dashboard/operations/reception')}
              className="flex-1 md:flex-none"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voir toutes les réceptions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}