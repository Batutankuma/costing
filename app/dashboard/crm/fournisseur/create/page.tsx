"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { createAction } from "../actions";
import { CreateFournisseurSchema } from "@/models/mvc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Building2, Save } from "lucide-react";

const fournisseurSchema = CreateFournisseurSchema;

type FournisseurFormData = z.infer<typeof fournisseurSchema>;

export default function CreateFournisseurPage() {
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
  } = useForm<FournisseurFormData>({
    resolver: zodResolver(fournisseurSchema),
    defaultValues: {
      nom: "",
      adresse: "",
    }
  });


  const router = useRouter();
  const { toast } = useToast();
  const { executeAsync, isExecuting: isPending } = useAction(createAction);

  const onSubmit = async (data: FournisseurFormData) => {
    try {
      const result = await executeAsync(data);
      if (!result?.data?.success) {
        throw new Error(result?.data?.failure || "Erreur inconnue lors de l'enregistrement.");
      }
      toast({ title: "Succès", description: "Fournisseur ajouté avec succès !" });
      router.push(`/dashboard/crm/fournisseur`);
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
      {/* Header avec navigation */}
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
          <h1 className="text-2xl font-semibold">Nouveau fournisseur</h1>
          <p className="text-sm text-muted-foreground">
            Ajoutez un nouveau fournisseur à votre base de données
          </p>
        </div>
      </div>

      {/* Formulaire dans une Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Informations du fournisseur
          </CardTitle>
          <CardDescription>
            Remplissez les informations ci-dessous pour créer un nouveau fournisseur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nom du fournisseur */}
            <div className="space-y-2">
              <Label htmlFor="nom" className="text-sm font-medium">
                Nom du fournisseur <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="nom" 
                placeholder="Ex: Entreprise ABC, Jean Dupont..." 
                {...register("nom")}
                className="h-10"
              />
              {errors.nom && (
                <p className="text-sm text-destructive">{errors.nom.message}</p>
              )}
            </div>

            {/* Adresse */}
            <div className="space-y-2">
              <Label htmlFor="adresse" className="text-sm font-medium">
                Adresse
              </Label>
              <Input 
                id="adresse" 
                type="text" 
                placeholder="Adresse complète du fournisseur (optionnel)" 
                {...register("adresse")}
                className="h-10"
              />
              {errors.adresse && (
                <p className="text-sm text-destructive">{errors.adresse.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                type="submit" 
                disabled={isPending} 
                className="flex-1 gap-2"
              >
                <Save className="h-4 w-4" />
                {isPending ? "Enregistrement..." : "Enregistrer le fournisseur"}
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
