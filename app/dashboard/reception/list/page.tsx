"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { findAllAction } from "../actions";
import { Reception } from "@/models/mvc";
import { columns } from "../columns";
import { DataTable } from "@/components/ui/data-table";
import ExportExcel from "@/components/exportExcel";
import { useToast } from "@/hooks/use-toast";
import UpdateNotification from "../components/update-notification";

export default function ReceptionListPage() {
  const [receptions, setReceptions] = useState<Reception[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const router = useRouter();
  const { toast } = useToast();

  const { executeAsync: executeFindAll, isExecuting: isRefreshing } = useAction(findAllAction);

  const loadReceptions = useCallback(async () => {
    try {
      setLoading(true);
     
      const result = await executeFindAll();

      if (result?.data?.success && result.data.result) {
        const newReceptions = result.data.result;
        setReceptions(newReceptions);
        setLastUpdate(new Date());
       
        // Afficher un toast de confirmation
        if (newReceptions.length > 0) {
          toast({
            title: "Données mises à jour",
            description: `${newReceptions.length} réceptions chargées avec succès`
          });
        }
      } else {
        console.error("❌ Erreur lors du chargement des réceptions:", result?.data?.failure);
        setReceptions([]);
        toast({
          variant: "destructive",
          title: "Erreur de chargement",
          description: result?.data?.failure || "Impossible de charger les réceptions"
        });
      }
    } catch (error) {
      console.error("❌ Erreur lors du chargement des réceptions:", error);
      setReceptions([]);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue s&apos;est produite"
      });
    } finally {
      setLoading(false);
    }
  }, [executeFindAll, toast]);

  useEffect(() => {
    loadReceptions();
  }, [loadReceptions]);

  const handleRefresh = () => {
    loadReceptions();
  };

  const handleDelete = useCallback(() => {
  // Délai court pour laisser le temps à la base de données de se mettre à jour
    setTimeout(() => {
      loadReceptions();
    }, 500);
  }, [loadReceptions]);

  // Rafraîchissement automatique toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !isRefreshing) {
        loadReceptions();
      }
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, [loadReceptions, loading, isRefreshing]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Chargement des réceptions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Liste des Réceptions</h1>
          <p className="text-muted-foreground">
            Gestion et suivi de toutes les réceptions de produits
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Dernière mise à jour : {lastUpdate.toLocaleTimeString('fr-FR')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Actualisation...' : 'Actualiser'}
          </Button>
          <ExportExcel
            data={receptions}
            filename="receptions"
            className="mr-2"
          />
          <Button onClick={() => router.push('/dashboard/reception/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle Réception
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{receptions.length}</div>
          <div className="text-sm text-blue-700">Total des réceptions</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {receptions.filter(r => r.receptionStatus === 'RECEIVED').length}
          </div>
          <div className="text-sm text-green-700">Réceptions confirmées</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {receptions.filter(r => r.receptionStatus === 'IN_TRANSIT').length}
          </div>
          <div className="text-sm text-yellow-700">En transit</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">
            {receptions.filter(r => r.receptionStatus === 'CANCELLED').length}
          </div>
          <div className="text-sm text-red-700">Annulées</div>
        </div>
      </div>

      {/* Tableau des réceptions */}
      <div className="bg-white rounded-lg border shadow-sm">
        <DataTable
          columns={columns as any}
          data={receptions}
        />
      </div>

      {/* Notification des mises à jour */}
      <UpdateNotification
        lastUpdate={lastUpdate}
        isRefreshing={isRefreshing}
        hasUpdates={receptions.length > 0}
      />

      {/* Informations sur les actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Actions disponibles :</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
          <div>
            <strong>👁️ Voir :</strong> Consulter les détails d&apos;une réception
          </div>
          <div>
            <strong>✏️ Modifier :</strong> Modifier une réception existante
          </div>
          <div>
            <strong>🗑️ Supprimer :</strong> Supprimer une réception et annuler ses effets
          </div>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          <strong>Note :</strong> La suppression d&apos;une réception annule automatiquement tous ses effets
          (stock, tank, commande) pour maintenir la cohérence des données. La liste se rafraîchit automatiquement.
        </p>
        <p className="text-xs text-blue-600 mt-1">
          <strong>Rafraîchissement automatique :</strong> Toutes les 30 secondes
        </p>
      </div>
    </div>
  );
}
