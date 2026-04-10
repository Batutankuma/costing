"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { createModuleAction } from "../actions";
import { CreateModuleSchema } from "@/models/mvc.pruned";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Package, Save } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const moduleSchema = CreateModuleSchema;

type ModuleFormInput = z.input<typeof moduleSchema>;
type ModuleFormOutput = z.infer<typeof moduleSchema>;

export default function CreateModulePage() {
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    setValue,
    watch,
  } = useForm<ModuleFormInput, unknown, ModuleFormOutput>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      name: "",
      type: "FINANCE",
      description: "",
      isActive: true,
    }
  });

  const router = useRouter();
  const { toast } = useToast();
  const { executeAsync, isExecuting: isPending } = useAction(createModuleAction);
  const isActive = watch("isActive");

  const onSubmit = async (data: ModuleFormOutput) => {
    try {
      const result = await executeAsync(data);
      if (!result?.data?.success) {
        throw new Error(result?.data?.failure || "Erreur inconnue lors de l'enregistrement.");
      }
      toast({ title: "Succès", description: "Module ajouté avec succès !" });
      router.push(`/dashboard/settings/modules`);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Une erreur est survenue lors de l'enregistrement.";
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: errorMessage
      });
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
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
          <h1 className="text-2xl font-semibold">Nouveau module</h1>
          <p className="text-sm text-muted-foreground">
            Ajoutez un nouveau module à votre système
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Informations du module
          </CardTitle>
          <CardDescription>
            Remplissez les informations ci-dessous pour créer un nouveau module
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="name" 
                placeholder="Ex: Module Finance, Module CRM..." 
                {...register("name")}
                className="h-10"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-sm font-medium">
                Type <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={(value) => setValue("type", value as ModuleFormOutput["type"])}
                defaultValue="FINANCE"
              >
                <SelectTrigger id="type" className="h-10">
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FINANCE">Finance</SelectItem>
                  <SelectItem value="CRM">CRM</SelectItem>
                  <SelectItem value="DEPOT_AUTRES">Dépôt Autres</SelectItem>
                  <SelectItem value="DEPOT_KALEMIE">Dépôt Kalemie</SelectItem>
                  <SelectItem value="DEPOT_LUBUMBASHI">Dépôt Lubumbashi</SelectItem>
                  <SelectItem value="DEPOT_KINSHASA">Dépôt Kinshasa</SelectItem>
                  <SelectItem value="OPERATION">Opération</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea 
                id="description" 
                placeholder="Description du module (optionnel)" 
                {...register("description")}
                className="min-h-[100px]"
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2 rounded-lg border p-4">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue("isActive", checked === true)}
              />
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                  Module actif
                </Label>
                <p className="text-sm text-muted-foreground">
                  Activez ou désactivez ce module
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button 
                type="submit" 
                disabled={isPending} 
                className="flex-1 gap-2"
              >
                <Save className="h-4 w-4" />
                {isPending ? "Enregistrement..." : "Enregistrer le module"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
              >
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
