"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/progress";
import { useRouter } from "next/navigation";
import { Plus, Package, CheckCircle, Clock, AlertTriangle, List } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { findAllAction as findAllCommandes } from "@/app/dashboard/commande/actions";
import { Commande, CommandeStatus } from "@/models/mvc";
import QuickNav from "../components/quick-nav";

export default function ReceptionDashboardPage() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const { executeAsync: executeCommandes } = useAction(findAllCommandes);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log("🔄 Chargement des données de réception...");
        
        // Charger les commandes
        const commandesResult = await executeCommandes();
        if (commandesResult?.data?.success && commandesResult.data.result) {
          setCommandes((commandesResult.data.result as any[]) || []);
          console.log(`✅ ${commandesResult.data.result.length} commandes chargées`);
        }


      } catch (error) {
        console.error("❌ Erreur lors du chargement des données:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [executeCommandes]);

  // Rafraîchissement automatique toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!loading) {
        console.log("🔄 Rafraîchissement automatique des données...");
        try {
          // Recharger les données
          const commandesResult = await executeCommandes();
          if (commandesResult?.data?.success && commandesResult.data.result) {
            setCommandes((commandesResult.data.result as any[]) || []);
          }


        } catch (error) {
          console.error("❌ Erreur lors du rafraîchissement automatique:", error);
        }
      }
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [loading, executeCommandes]);

  // Calculer les statistiques
  const totalCommandes = commandes.length;
  const commandesConfirmees = commandes.filter(c => c.status === "CONFIRMED").length;
  const commandesPartiellementRecues = commandes.filter(c => c.status === "PARTIALLY_RECEIVED").length;
  const commandesTerminees = commandes.filter(c => c.status === "COMPLETED").length;


  // Calculer le pourcentage global de réception
  const totalQuantity = commandes.reduce((sum, c) => sum + c.quantity, 0);
  const totalReceived = commandes.reduce((sum, c) => sum + (c.quantity - c.currentQuantity), 0);
  const globalPercentage = totalQuantity > 0 ? (totalReceived / totalQuantity) * 100 : 0;

  const getStatusColor = (status: CommandeStatus) => {
    switch (status) {
      case "DRAFT": return "secondary";
      case "CONFIRMED": return "default";
      case "PARTIALLY_RECEIVED": return "outline";
      case "COMPLETED": return "default";
      case "CANCELLED": return "destructive";
      default: return "outline";
    }
  };

  const getStatusText = (status: CommandeStatus) => {
    switch (status) {
      case "DRAFT": return "Brouillon";
      case "CONFIRMED": return "Confirmée";
      case "PARTIALLY_RECEIVED": return "Partiellement reçue";
      case "COMPLETED": return "Terminée";
      case "CANCELLED": return "Annulée";
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Chargement des données...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Navigation rapide */}
      <QuickNav />
      
      {/* Contenu existant */}
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion des Réceptions</h1>
            <p className="text-muted-foreground">
              Suivi des réceptions et des commandes en cours
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline"
              onClick={() => router.push('/dashboard/operations/reception')}
            >
              <List className="h-4 w-4 mr-2" />
              Voir la liste
            </Button>
            <Button onClick={() => router.push('/dashboard/operations/reception/create')}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une réception
            </Button>
          </div>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Commandes</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCommandes}</div>
              <p className="text-xs text-muted-foreground">
                Toutes les commandes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes Confirmées</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{commandesConfirmees}</div>
              <p className="text-xs text-muted-foreground">
                En attente de réception
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Partiellement Reçues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{commandesPartiellementRecues}</div>
              <p className="text-xs text-muted-foreground">
                Réception en cours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commandes Terminées</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{commandesTerminees}</div>
              <p className="text-xs text-muted-foreground">
                Entièrement reçues
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progression globale */}
        <Card>
          <CardHeader>
            <CardTitle>Progression Globale des Réceptions</CardTitle>
            <CardDescription>
              Pourcentage global de réception sur toutes les commandes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progression</span>
                <span className="font-medium">{globalPercentage.toFixed(1)}%</span>
              </div>
              <Progress value={globalPercentage} className="h-3" />
              <div className="text-xs text-muted-foreground">
                {totalReceived.toFixed(0)} / {totalQuantity.toFixed(0)} unités reçues
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des commandes avec statut de réception */}
        <Card>
          <CardHeader>
            <CardTitle>Commandes et Statut de Réception</CardTitle>
            <CardDescription>
              Vue d&apos;ensemble des commandes et de leur progression de réception
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {commandes
                .filter(c => c.status !== "CANCELLED" && c.status !== "DRAFT")
                .map((commande) => {
                  const percentageReceived = ((commande.quantity - commande.currentQuantity) / commande.quantity) * 100;
                  const isCompleted = commande.status === "COMPLETED";
                  const isPartiallyReceived = commande.status === "PARTIALLY_RECEIVED";
                  
                  return (
                    <div key={commande.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{commande.reference}</h3>
                          <p className="text-sm text-muted-foreground">
                            Produit ID: {commande.produitId}
                          </p>
                        </div>
                        <Badge variant={getStatusColor(commande.status) as "default" | "destructive" | "outline" | "secondary"}>
                          {getStatusText(commande.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Quantité commandée:</span>
                          <div className="text-lg font-semibold">{commande.quantity} {commande.unit || 'unités'}</div>
                        </div>
                        <div>
                          <span className="font-medium">Quantité restante:</span>
                          <div className={`text-lg font-semibold ${
                            commande.currentQuantity === 0 ? 'text-green-600' : 
                            commande.currentQuantity < commande.quantity ? 'text-orange-600' : 'text-blue-600'
                          }`}>
                            {commande.currentQuantity} {commande.unit || 'unités'}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium">Progression:</span>
                          <div className="text-lg font-semibold">{percentageReceived.toFixed(1)}%</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>0%</span>
                          <span>100%</span>
                        </div>
                        <Progress 
                          value={percentageReceived} 
                          className={`h-2 ${
                            isCompleted ? 'bg-green-100' : 
                            isPartiallyReceived ? 'bg-orange-100' : 'bg-blue-100'
                          }`}
                        />
                      </div>
                      
                      {commande.currentQuantity > 0 && (
                        <div className="flex justify-end">
                          <Button 
                            size="sm" 
                            onClick={() => router.push(`/dashboard/operations/reception/create?commandeId=${commande.id}`)}
                          >
                            <Plus className="mr-2 h-3 w-3" />
                            Ajouter une réception
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
