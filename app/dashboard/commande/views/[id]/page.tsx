'use client';

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { z } from "zod";

import { CommandeSchema } from "@/models/mvc"; 

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Printer, Edit, Calendar, Package, Building2, Truck, FileText, DollarSign, Receipt } from "lucide-react";
import { findByIdAction } from "../../actions";

type CommandeData = z.infer<typeof CommandeSchema> & {
  produit?: { name: string };
  depot?: { name: string };
  fournisseur?: { nom: string };
  hospitalityRows?: Array<{ offlQty20: number }>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export default function ViewCommandePage() {
  const [commandeId, setCommandeId] = useState<string | null>(null);
  const [commande, setCommande] = useState<CommandeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const id = params?.id as string | undefined;
    if (id) {
      setCommandeId(id);
    } else {
      setError("Commande ID is missing from URL parameters.");
      setLoading(false);
    }
  }, [params?.id]); // Utiliser seulement params.id au lieu de tout l'objet params

  useEffect(() => {
    if (!commandeId) return;

    let isMounted = true;

    async function fetchCommande() {
      setLoading(true);
      setError(null);
      try {
        const result = await findByIdAction(commandeId!);
        if (!isMounted) return;
        
        if (result.success && result.result) {
          setCommande(result.result as CommandeData); 
        } else if (result.failure) {
          setError(result.failure);
          toast({ variant: "destructive", title: "Error", description: result.failure });
        } else {
          setError("Commande not found.");
          toast({ variant: "destructive", title: "Error", description: "Commande not found." });
        }
      } catch {
        if (!isMounted) return;
        setError("An unexpected error occurred while loading data.");
        toast({ variant: "destructive", title: "Error", description: "Failed to load data." });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchCommande();

    return () => {
      isMounted = false;
    };
  }, [commandeId]); // Retirer toast des dépendances

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
        <Button variant="outline" onClick={() => router.push(`/dashboard/commande`)}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  if (!commande) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <p className="text-gray-700">Aucune donnée commande disponible pour cet ID.</p>
        <Button variant="outline" onClick={() => router.push(`/dashboard/commande`)}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      DRAFT: { label: "Brouillon", variant: "outline" },
      CONFIRMED: { label: "Confirmé", variant: "default" },
      COMPLETED: { label: "Terminé", variant: "secondary" },
      CANCELLED: { label: "Annulé", variant: "destructive" },
      PARTIALLY_RECEIVED: { label: "Partiellement reçu", variant: "secondary" },
    };
    const statusInfo = statusMap[status] || { label: status, variant: "outline" as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number | null | undefined, devise: string | null | undefined = "USD") => {
    if (amount === null || amount === undefined) return "N/A";
    return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${devise || "USD"}`;
  };

  const calculateTotal = () => {
    const hospitalityQty = commande.hospitalityRows?.reduce((sum, row) => sum + Number(row.offlQty20 || 0), 0) || 0;
    const quantite = Number(commande.quantite || 0) + hospitalityQty;
    const unitPrice = commande.unitPrice || 0;
    const tva = commande.tva || 0;
    const subtotal = quantite * unitPrice;
    const totalTVA = subtotal * (tva / 100);
    return {
      subtotal,
      tva: totalTVA,
      total: subtotal + totalTVA
    };
  };

  const totals = calculateTotal();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/commande')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Détails de la Commande</h1>
            <p className="text-muted-foreground">Référence: {commande.reference}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
          <Button asChild className="gap-2">
            <Link href={`/dashboard/commande/${commande.id}`}>
              <Edit className="h-4 w-4" />
              Modifier
            </Link>
          </Button>
        </div>
      </div>

      {/* Informations principales */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Informations Générales
            </CardTitle>
            {getStatusBadge(commande.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date de Commande
              </Label>
              <p className="text-lg font-semibold">{formatDate(commande.date)}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produit
              </Label>
              <p className="text-lg font-semibold">{commande.produit?.name || commande.produitId || "N/A"}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Dépôt
              </Label>
              <p className="text-lg font-semibold">{commande.depot?.name || commande.depotId || "N/A"}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Fournisseur
              </Label>
              <p className="text-lg font-semibold">{commande.fournisseur?.nom || commande.fournisseurId || "N/A"}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Quantité</Label>
              <p className="text-lg font-semibold">
                {(Number(commande.quantite || 0) + (commande.hospitalityRows?.reduce((sum, row) => sum + Number(row.offlQty20 || 0), 0) || 0)).toLocaleString('fr-FR')}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Devise
              </Label>
              <p className="text-lg font-semibold">{commande.devise || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations financières */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Informations Financières
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Prix Unitaire</Label>
              <p className="text-lg font-semibold">{formatCurrency(commande.unitPrice, commande.devise || undefined)}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Sous-total</Label>
              <p className="text-lg font-semibold">{formatCurrency(totals.subtotal, commande.devise || undefined)}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">TVA ({commande.tva || 0}%)</Label>
              <p className="text-lg font-semibold">{formatCurrency(totals.tva, commande.devise || undefined)}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Total TTC</Label>
              <p className="text-xl font-bold text-primary">{formatCurrency(totals.total, commande.devise || undefined)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations facture */}
      {(commande.numeroFacture || commande.typeFacture || commande.dateFacture) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Informations Facture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {commande.numeroFacture && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Numéro de Facture
                  </Label>
                  <p className="text-lg font-semibold">{commande.numeroFacture}</p>
                </div>
              )}

              {commande.typeFacture && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Type de Facture</Label>
                  <p className="text-lg font-semibold">{commande.typeFacture}</p>
                </div>
              )}

              {commande.dateFacture && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date de Facture
                  </Label>
                  <p className="text-lg font-semibold">{formatDate(commande.dateFacture)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métadonnées */}
      <Card>
        <CardHeader>
          <CardTitle>Métadonnées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Date de Création</Label>
              <p className="text-sm">{formatDate(commande.createdAt)}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Dernière Mise à Jour</Label>
              <p className="text-sm">{formatDate(commande.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}