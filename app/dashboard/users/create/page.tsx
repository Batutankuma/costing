"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreateUserSchema } from "@/models/mvc.pruned";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAction } from "next-safe-action/hooks";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { adminCreateWithPasswordAction } from "../actions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { assignModulesToUserAction } from "@/app/dashboard/settings/users-modules/actions";
import { getAllModulesForSelection } from "@/app/dashboard/settings/users-modules/actions";
import { useEffect } from "react";

// Utiliser le type d'entrée du schéma (avant defaults) pour correspondre au resolver
type UserFormData = z.input<typeof CreateUserSchema>;

export default function CreateUserPage() {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<UserFormData>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: { name: "", email: "", emailVerified: false, role: "COMMERCIAL" },
  });

  const [passwordModal, setPasswordModal] = React.useState<{ open: boolean; value: string | null; userId?: string }>({ open: false, value: null });
  const [modules, setModules] = React.useState<Array<{ id: string; name: string; type: string }>>([]);
  const [selectedModules, setSelectedModules] = React.useState<string[]>([]);
  const [loadingModules, setLoadingModules] = React.useState(true);

  const router = useRouter();
  const { toast } = useToast();
  
  const { executeAsync, status: actionStatus } = useAction(adminCreateWithPasswordAction);
  const { executeAsync: executeAssignModules } = useAction(assignModulesToUserAction);
  const isPending = actionStatus === "executing";

  const { executeAsync: executeGetModules } = useAction(getAllModulesForSelection);

  useEffect(() => {
    async function loadModules() {
      try {
        const result = await executeGetModules();
        if (result?.data?.success && result.data.result) {
          setModules(result.data.result);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des modules:", error);
      } finally {
        setLoadingModules(false);
      }
    }
    loadModules();
  }, [executeGetModules]);

  const onSubmit = async (data: UserFormData) => {
    try {
      const result = await executeAsync(data);
      if (result?.data?.success) {
        type SuccessResult = { password?: string; userId?: string; ok?: boolean };
        const successData = result.data.success as SuccessResult;
        const generated = successData.password;
        const userId = successData.userId;

        // Si des modules sont sélectionnés, les assigner à l'utilisateur
        if (selectedModules.length > 0 && userId && typeof userId === 'string') {
          try {
            // Filtrer les IDs valides
            const validModuleIds = selectedModules.filter(id => id && typeof id === 'string' && id.trim() !== '');
            
            if (validModuleIds.length > 0) {
              const assignResult = await executeAssignModules({
                userId,
                moduleIds: validModuleIds,
              });
              if (!assignResult?.data?.success) {
                toast({
                  variant: "destructive",
                  title: "Attention",
                  description: "Utilisateur créé mais erreur lors de l'attribution des modules: " + (assignResult?.data?.failure || "Erreur inconnue"),
                });
              }
            }
          } catch (error) {
            console.error("Erreur lors de l'attribution des modules:", error);
            toast({
              variant: "destructive",
              title: "Erreur",
              description: "Erreur lors de l'attribution des modules. L'utilisateur a été créé mais les modules n'ont pas été attribués.",
            });
          }
        }

        if (generated) {
          try { await navigator.clipboard.writeText(generated); } catch {}
          setPasswordModal({ open: true, value: generated, userId });
        } else {
          toast({ title: "Succès", description: "Utilisateur créé avec succès !" });
          router.push(`/dashboard/users`);
        }
      } else if (result?.data?.failure) {
        toast({ 
          variant: "destructive", 
          title: "Erreur", 
          description: result.data.failure || "Impossible de créer l'utilisateur" 
        });
      } else if (result?.serverError) {
        toast({ 
          variant: "destructive", 
          title: "Erreur serveur", 
          description: result.serverError || "Une erreur serveur est survenue" 
        });
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Une erreur est survenue";
      toast({ variant: "destructive", title: "Erreur", description: errorMessage });
    }
  };

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

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Créer un Nouvel Utilisateur</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations de l'utilisateur</CardTitle>
            <CardDescription>Remplissez les informations de base de l'utilisateur</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nom <span className="text-red-500">*</span></Label>
              <Input id="name" placeholder="Nom" {...register("name")} />
              {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
            </div>
            <div>
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input id="email" type="email" placeholder="email@exemple.com" {...register("email")} />
              {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
            </div>
            
            <div>
              <Label>Rôle <span className="text-red-500">*</span></Label>
              <Select value={watch("role")} onValueChange={(v) => setValue("role", v as UserFormData["role"])}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-red-500 text-sm">{errors.role.message}</p>}
            </div>
            <div className="flex items-center gap-3">
              <Checkbox id="emailVerified" {...register("emailVerified")} />
              <Label htmlFor="emailVerified" className="cursor-pointer">Email vérifié</Label>
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
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Enregistrement..." : "Enregistrer l'utilisateur"}
          </Button>
        </div>
      </form>

      <Dialog open={passwordModal.open} onOpenChange={(o) => setPasswordModal((s) => ({ ...s, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mot de passe généré</DialogTitle>
            <DialogDescription>Partagez ce mot de passe avec l&apos;utilisateur. Il pourra le changer après connexion.</DialogDescription>
          </DialogHeader>
          <div className="rounded-md border p-3 font-mono text-sm select-all">
            {passwordModal.value}
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button type="button" onClick={async () => { if (passwordModal.value) { try { await navigator.clipboard.writeText(passwordModal.value); } catch {} } }}>Copier</Button>
              <Button type="button" onClick={() => { setPasswordModal({ open: false, value: null }); router.push(`/dashboard/users`); }}>Fermer</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


