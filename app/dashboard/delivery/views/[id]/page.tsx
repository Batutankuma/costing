'use client';

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { z } from "zod";
import { useAction } from "next-safe-action/hooks";
import { Badge } from "@/components/ui/badge";

import { DeliverySchema } from "@/models/mvc"; 
import { getClients } from "@/app/dashboard/clients/actions";
import { listDepots } from "@/app/dashboard/depots/actions";
import { findAllAction as findAllEquipment } from "@/app/dashboard/equipment/actions";
import { listProducts } from "@/app/dashboard/products/actions";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Edit, FileText, Calendar, Clock, Plane, Fuel, DollarSign } from "lucide-react";
import { findByIdAction } from "../../actions";
// Local minimal reference types to avoid depending on missing exports
type ClientRef = { id: string; nom?: string };
type DepotRef = { id: string; name?: string };
type EquipmentRef = { id: string; name?: string };
type ProduitRef = { id: string; nom?: string };

type DeliveryData = z.infer<typeof DeliverySchema>;

// Composants pour afficher les noms des relations
function ClientName({ clientId }: { clientId: string }) {
  const [clientName, setClientName] = useState<string>("");
  

  useEffect(() => {
    const loadClient = async () => {
      try {
        const items = await getClients();
        const client = (items as ClientRef[]).find((c) => c.id === clientId);
        if (client) setClientName(client.nom || "");
      } catch (error) {
        console.error("Erreur lors du chargement du client:", error);
      }
    };

    if (clientId) {
      loadClient();
    }
  }, [clientId]);

  return <span className="text-lg font-medium">{clientName || clientId}</span>;
}

function DepotName({ depotId }: { depotId: string }) {
  const [depotName, setDepotName] = useState<string>("");
  const { executeAsync } = useAction(listDepots);

  useEffect(() => {
    const loadDepot = async () => {
      try {
        const result = await executeAsync();
        const depots: DepotRef[] = (result?.data?.data ?? []) as DepotRef[];
        const depot = depots.find((d) => d.id === depotId);
        if (depot) {
          setDepotName(depot.name || "");
        }
      } catch (error) {
        console.error("Erreur lors du chargement du dépôt:", error);
      }
    };

    if (depotId) {
      loadDepot();
    }
  }, [depotId, executeAsync]);

  return <span className="text-lg font-medium">{depotName || depotId}</span>;
}

function EquipmentName({ equipmentId }: { equipmentId: string }) {
  const [equipmentName, setEquipmentName] = useState<string>("");
  const { executeAsync: execEquipment } = useAction(findAllEquipment);

  useEffect(() => {
    const loadEquipment = async () => {
      try {
        const result = await execEquipment();
        const equipmentList: EquipmentRef[] = (result?.data?.result ?? []) as EquipmentRef[];
        const equipment = equipmentList.find((e) => e.id === equipmentId);
        if (equipment) {
          setEquipmentName(equipment.name || "");
        }
      } catch (error) {
        console.error("Erreur lors du chargement de l'équipement:", error);
      }
    };

    if (equipmentId) {
      loadEquipment();
    }
  }, [equipmentId, execEquipment]);

  return <span className="text-lg font-medium">{equipmentName || equipmentId}</span>;
}

function ProduitName({ produitId }: { produitId: string }) {
  const [produitName, setProduitName] = useState<string>("");
  const { executeAsync: execProducts } = useAction(listProducts);

  useEffect(() => {
    const loadProduit = async () => {
      try {
        const result = await execProducts();
        const produits: ProduitRef[] = (result?.data?.data ?? []).map((p: { id: string; name: string }) => ({ id: p.id, nom: p.name })) as ProduitRef[];
        const produit = produits.find((p) => p.id === produitId);
        if (produit) {
          setProduitName(produit.nom || "");
        }
      } catch (error) {
        console.error("Erreur lors du chargement du produit:", error);
      }
    };

    if (produitId) {
      loadProduit();
    }
  }, [produitId, execProducts]);

  return <span className="text-lg font-medium">{produitName || produitId}</span>;
}

// Fonction pour obtenir la couleur du badge de paiement
function getPaiementColor(paiement: string) {
  switch (paiement) {
    case "DIRECT":
      return "bg-green-100 text-green-800";
    case "CREDIT":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Fonction pour obtenir le texte du paiement
function getPaiementText(paiement: string) {
  switch (paiement) {
    case "DIRECT":
      return "Direct";
    case "CREDIT":
      return "Crédit";
    default:
      return paiement;
  }
}

export default function ViewDeliveryPage() {
  const [deliveryId, setDeliveryId] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<DeliveryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    if (params && params.id) {
      setDeliveryId(params.id as string);
    } else {
      setError("ID de livraison manquant dans les paramètres URL.");
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    if (!deliveryId) return;

    async function fetchDelivery() {
      setLoading(true);
      setError(null);
      try {
        const result = await findByIdAction(deliveryId!);
        
        if (result.success && result.result) {
          setDelivery(result.result as DeliveryData); 
        } else if (result.failure) {
          setError(result.failure);
          toast({ variant: "destructive", title: "Erreur", description: result.failure });
        } else {
          setError("Livraison non trouvée.");
          toast({ variant: "destructive", title: "Erreur", description: "Livraison non trouvée." });
        }
      } catch {
        setError("Une erreur inattendue s'est produite lors du chargement des données.");
        toast({ variant: "destructive", title: "Erreur", description: "Échec du chargement des données." });
      } finally {
        setLoading(false);
      }
    }

    fetchDelivery();
  }, [deliveryId, toast]);

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
        <Button variant="outline" onClick={() => router.push(`/dashboard/delivery`)}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <p className="text-gray-700">Aucune donnée de livraison disponible pour cet ID.</p>
        <Button variant="outline" onClick={() => router.push(`/dashboard/delivery`)}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold">Détails de la Livraison Aviation</h1>
        </div>
        <Button onClick={() => router.push(`/dashboard/delivery/${delivery.id}`)}>
          <Edit className="h-4 w-4 mr-2" />
          Modifier
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informations Générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Note de livraison</Label>
              <p className="text-lg font-semibold">{delivery.note}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Date</Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <p className="text-lg">
                  {delivery.deliveryDate ? new Date(delivery.deliveryDate).toLocaleDateString('fr-FR', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  }) : "N/A"}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Prix unitaire</Label>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <p className="text-lg font-semibold">
                  {delivery.prixUnitaire ? `${delivery.prixUnitaire.toFixed(2)} USD` : "N/A"}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Type de paiement</Label>
              <Badge className={getPaiementColor(delivery.paiement || "CREDIT")}>
                {getPaiementText(delivery.paiement || "CREDIT")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Relations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Relations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Client</Label>
              <ClientName clientId={delivery.clientId ?? ""} />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Dépôt</Label>
              <DepotName depotId={delivery.depotId ?? ""} />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Equipment</Label>
              <EquipmentName equipmentId={delivery.equipmentId ?? ""} />
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Produit</Label>
              <ProduitName produitId={delivery.produitId ?? ""} />
            </div>
          </CardContent>
        </Card>

        {/* Informations aviation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Informations Aviation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Type d&apos;avion</Label>
              <p className="text-lg font-semibold">{delivery.typeAircraft || "-"}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Numéro de vol</Label>
              <p className="text-lg font-semibold">{delivery.flightNumber || "-"}</p>
            </div>

            {/* Horaires non disponibles dans le schéma actuel */}
          </CardContent>
        </Card>

        {/* Mesures et compteurs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fuel className="h-5 w-5" />
              Mesures et Compteurs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Compteur d&apos;ouverture</Label>
              <p className="text-lg font-semibold">{delivery.openingEter}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Compteur de fermeture</Label>
              <p className="text-lg font-semibold">{delivery.closingEter}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Différence</Label>
              <p className="text-lg font-bold text-blue-600">
                {(delivery.closingEter ?? 0) - (delivery.openingEter ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Document section removed: linkDoc not in schema */}
      </div>
    </div>
  );
}