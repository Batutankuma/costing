"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAction } from "next-safe-action/hooks";
import { assignModulesToUserAction, getAllModulesForSelection } from "../actions";
import { ArrowLeft, Save, Users } from "lucide-react";
import { Loader2 } from "lucide-react";

const getModuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
        FINANCE: "Finance",
        CRM: "CRM",
        DEPOT_AUTRES: "Dépôt Autres",
        DEPOT_KALEMIE: "Dépôt Kalemie",
        DEPOT_LUBUMBASHI: "Dépôt Lubumbashi",
        DEPOT_KINSHASA: "Dépôt Kinshasa",
        OPERATION: "Opération",
    };
    return labels[type] || type;
};

export default function ManageUserModulesPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const userId = params?.userId as string;

  const [modules, setModules] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [userModules, setUserModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");

  const { executeAsync: executeGetModules } = useAction(getAllModulesForSelection);
  const { executeAsync: executeAssignModules, status: assignStatus } = useAction(assignModulesToUserAction);

  useEffect(() => {
    if (!userId) return;

    async function loadData() {
      setLoading(true);
      try {
        // Charger les modules disponibles
        const modulesResult = await executeGetModules();
        if (modulesResult?.data?.success && modulesResult.data.result) {
          setModules(modulesResult.data.result);
        }

        // Charger les modules de l'utilisateur
        const userModulesResult = await fetch(`/api/users/${userId}/modules`);
        if (userModulesResult.ok) {
          const data = await userModulesResult.json();
          if (data.success && data.result) {
            setUserModules(data.result.map((um: { moduleId: string }) => um.moduleId));
            setUserName(data.userName || "");
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les données",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [userId, executeGetModules, toast]);

  const toggleModule = (moduleId: string) => {
    setUserModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleSubmit = async () => {
    if (!userId || typeof userId !== 'string') {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "ID utilisateur invalide",
      });
      return;
    }

    try {
      // Filtrer les IDs valides
      const validModuleIds = userModules.filter(id => id && typeof id === 'string' && id.trim() !== '');
      
      const result = await executeAssignModules({
        userId,
        moduleIds: validModuleIds,
      });

      if (result?.data?.success) {
        toast({ title: "Succès", description: "Modules attribués avec succès !" });
        router.push("/dashboard/settings/users-modules");
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result?.data?.failure || "Impossible d'attribuer les modules",
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'attribution des modules:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'attribution des modules",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <div className="h-6 w-px bg-border" />
        <div>
          <h1 className="text-2xl font-semibold">Gérer les modules</h1>
          <p className="text-sm text-muted-foreground">
            {userName ? `Modules pour ${userName}` : "Sélectionnez les modules à attribuer"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Modules disponibles
          </CardTitle>
          <CardDescription>
            Cochez les modules que cet utilisateur pourra voir dans son interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          {modules.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun module disponible. Créez d'abord des modules dans les paramètres.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modules.map((module) => (
                <div key={module.id} className="flex items-center space-x-2 rounded-lg border p-3">
                  <Checkbox
                    id={`module-${module.id}`}
                    checked={userModules.includes(module.id)}
                    onCheckedChange={() => toggleModule(module.id)}
                  />
                  <Label htmlFor={`module-${module.id}`} className="cursor-pointer flex-1">
                    <div className="font-medium">{module.name}</div>
                    <div className="text-sm text-muted-foreground">{getModuleTypeLabel(module.type)}</div>
                  </Label>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={assignStatus === "executing"}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {assignStatus === "executing" ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
