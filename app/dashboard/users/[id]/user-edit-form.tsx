"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAction } from "next-safe-action/hooks";
import { updateAction, adminResetPasswordAction } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { assignModulesToUserAction } from "@/app/dashboard/settings/users-modules/actions";
import { getAllModulesForSelection } from "@/app/dashboard/settings/users-modules/actions";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

type UserInitial = {
  id: string;
  name: string;
  email: string;
  image: string;
  emailVerified: boolean;
  role?: "ADMIN" | "COMMERCIAL";
};

export default function UserEditForm({ initial }: { initial: UserInitial }) {
  const [name, setName] = React.useState(initial.name);
  const [email, setEmail] = React.useState(initial.email);
  const [image, setImage] = React.useState(initial.image);
  const [emailVerified, setEmailVerified] = React.useState(initial.emailVerified);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const { executeAsync, status } = useAction(updateAction);
  const { executeAsync: execReset, status: resetStatus } = useAction(adminResetPasswordAction);
  const { executeAsync: executeAssignModules } = useAction(assignModulesToUserAction);
  const { executeAsync: executeGetModules } = useAction(getAllModulesForSelection);
  const { toast } = useToast();
  const isSubmitting = status === "executing";
  const [role, setRole] = React.useState<UserInitial["role"]>(initial.role ?? "COMMERCIAL");
  const [modules, setModules] = React.useState<Array<{ id: string; name: string; type: string }>>([]);
  const [selectedModules, setSelectedModules] = React.useState<string[]>([]);
  const [loadingModules, setLoadingModules] = React.useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function loadModules() {
      setLoadingModules(true);
      try {
        // Charger les modules disponibles
        const modulesResult = await executeGetModules();
        if (isMounted && modulesResult?.data?.success && modulesResult.data.result) {
          setModules(modulesResult.data.result);
        }

        // Charger les modules déjà attribués à l'utilisateur
        const userModulesResponse = await fetch(`/api/users/${initial.id}/modules`);
        if (isMounted && userModulesResponse.ok) {
          const userModulesData = await userModulesResponse.json();
          if (userModulesData.success && userModulesData.result) {
            setSelectedModules(userModulesData.result.map((um: { moduleId: string; module?: { id: string } }) => 
              um.module?.id || um.moduleId
            ));
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des modules:", error);
      } finally {
        if (isMounted) {
          setLoadingModules(false);
        }
      }
    }
    loadModules();
    
    return () => {
      isMounted = false;
    };
  }, [initial.id]);

  const toggleModule = (moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    
    // Valider les champs requis
    if (!name || !name.trim()) {
      setError("Le nom est requis.");
      return;
    }
    
    if (!email || !email.trim()) {
      setError("L'email est requis.");
      return;
    }
    
    // Mettre à jour les informations de l'utilisateur
    const updateData: {
      id: string;
      name?: string;
      email?: string;
      image?: string | null;
      emailVerified?: boolean;
      role?: "ADMIN" | "COMMERCIAL";
    } = {
      id: initial.id,
      name: name.trim(),
      email: email.trim(),
      emailVerified,
      role: role || "COMMERCIAL",
    };
    
    // Ajouter l'image seulement si elle n'est pas vide
    if (image && image.trim()) {
      updateData.image = image.trim();
    } else {
      updateData.image = null;
    }
    
    try {
      const result = await executeAsync(updateData);
      if (result?.data?.success) {
        // Attribuer les modules sélectionnés
        try {
          const validModuleIds = selectedModules.filter(id => id && typeof id === 'string' && id.trim() !== '');
          const assignResult = await executeAssignModules({
            userId: initial.id,
            moduleIds: validModuleIds,
          });
          if (!assignResult?.data?.success) {
            toast({
              variant: "destructive",
              title: "Attention",
              description: "Utilisateur modifié mais erreur lors de l'attribution des modules: " + (assignResult?.data?.failure || "Erreur inconnue"),
            });
          } else {
            setMessage("Utilisateur et modules modifiés avec succès.");
          }
        } catch (error) {
          console.error("Erreur lors de l'attribution des modules:", error);
          setMessage("Utilisateur modifié avec succès, mais erreur lors de l'attribution des modules.");
          toast({
            variant: "destructive",
            title: "Attention",
            description: "Erreur lors de l'attribution des modules.",
          });
        }
      } else {
        const errorMsg = result?.data?.failure || result?.serverError || "Erreur lors de la mise à jour.";
        setError(errorMsg);
        console.error("Erreur de mise à jour:", result);
      }
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      setError("Une erreur inattendue est survenue lors de la mise à jour.");
    }
  };

  const onResetPassword = async () => {
    setMessage(null);
    setError(null);
    const result = await execReset({ id: initial.id });
    if (result?.data?.success) {
      type SuccessResult = { password?: string };
      const pwd = (result.data.success as SuccessResult).password;
      if (pwd) {
        setMessage(`Nouveau mot de passe: ${pwd}`);
        try { await navigator.clipboard.writeText(pwd); } catch {}
      } else {
        setMessage("Mot de passe réinitialisé (aucun mot de passe généré)");
      }
    } else {
      setError(result?.data?.failure || "Réinitialisation échouée.");
    }
  };

  const router = useRouter();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Modifier Utilisateur</h1>
          <p className="text-sm text-muted-foreground mt-1">Modifiez les informations de l'utilisateur</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/users">Retour à la liste</Link>
        </Button>
      </div>

      {message && (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-600">{message}</div>
      )}
      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600">{error}</div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations de l'utilisateur</CardTitle>
            <CardDescription>Modifiez les informations de base de l'utilisateur</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom <span className="text-red-500">*</span></Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" type="email" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Avatar (URL)</Label>
              <Input id="image" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Rôle <span className="text-red-500">*</span></Label>
                <Select value={role || "COMMERCIAL"} onValueChange={(v) => setRole(v as "ADMIN" | "COMMERCIAL")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choisir un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Le rôle détermine les permissions de l'utilisateur dans le système
                </p>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border p-4">
                <Checkbox
                  id="emailVerified"
                  checked={emailVerified}
                  onCheckedChange={(checked) => setEmailVerified(checked === true)}
                />
                <div className="space-y-0.5">
                  <Label htmlFor="emailVerified" className="cursor-pointer">
                    Email vérifié
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Indique si l'email de l'utilisateur a été vérifié
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modules</CardTitle>
            <CardDescription>Sélectionnez les modules que cet utilisateur pourra voir dans son interface</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingModules ? (
              <p className="text-sm text-muted-foreground">Chargement des modules...</p>
            ) : modules.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun module disponible. Créez d'abord des modules dans les paramètres.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {modules.map((module) => (
                  <div key={module.id} className="flex items-center space-x-2 rounded-lg border p-3">
                    <Checkbox
                      id={`module-${module.id}`}
                      checked={selectedModules.includes(module.id)}
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

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Actions disponibles pour cet utilisateur</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Mise à jour..." : "Mettre à jour l'utilisateur"}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={onResetPassword} 
                disabled={resetStatus === "executing"}
              >
                {resetStatus === "executing" ? "Réinitialisation..." : "Réinitialiser mot de passe"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}


