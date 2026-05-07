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
      company: "",
      contactName: "",
      email: "",
      phone: "",
      adresse: "",
      rccm: "",
      idNat: "",
      nif: "",
      pays: "",
      notes: "",
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
            <p className="text-sm text-muted-foreground">
              <span className="text-destructive">*</span> Champs obligatoires
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Société */}
              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-medium">
                  Société <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="company" 
                  placeholder="Ex: Entreprise ABC" 
                  {...register("company")}
                  className="h-10"
                />
                {errors.company && (
                  <p className="text-sm text-destructive">{errors.company.message}</p>
                )}
              </div>

              {/* Contact */}
              <div className="space-y-2">
                <Label htmlFor="contactName" className="text-sm font-medium">
                  Nom du contact
                </Label>
                <Input 
                  id="contactName" 
                  placeholder="Ex: Jean Dupont" 
                  {...register("contactName")}
                  className="h-10"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email du contact
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="email@exemple.com" 
                  {...register("email")}
                  className="h-10"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              {/* Téléphone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Téléphone du contact
                </Label>
                <Input 
                  id="phone" 
                  placeholder="+243 XXX XXX XXX" 
                  {...register("phone")}
                  className="h-10"
                />
              </div>
            </div>

            {/* Adresse */}
            <div className="space-y-2">
              <Label htmlFor="adresse" className="text-sm font-medium">
                Adresse
              </Label>
              <Input 
                id="adresse" 
                type="text" 
                placeholder="Adresse complète (optionnel)" 
                {...register("adresse")}
                className="h-10"
              />
              {errors.adresse && (
                <p className="text-sm text-destructive">{errors.adresse.message}</p>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* RCCM */}
              <div className="space-y-2">
                <Label htmlFor="rccm" className="text-sm font-medium">
                  RCCM
                </Label>
                <Input 
                  id="rccm" 
                  placeholder="N° RCCM" 
                  {...register("rccm")}
                  className="h-10"
                />
              </div>

              {/* ID NAT */}
              <div className="space-y-2">
                <Label htmlFor="idNat" className="text-sm font-medium">
                  ID NAT
                </Label>
                <Input 
                  id="idNat" 
                  placeholder="N° ID National" 
                  {...register("idNat")}
                  className="h-10"
                />
              </div>

              {/* NIF */}
              <div className="space-y-2">
                <Label htmlFor="nif" className="text-sm font-medium">
                  NIF
                </Label>
                <Input 
                  id="nif" 
                  placeholder="N° NIF" 
                  {...register("nif")}
                  className="h-10"
                />
              </div>
            </div>

            {/* Pays */}
            <div className="space-y-2">
              <Label htmlFor="pays" className="text-sm font-medium">
                Pays
              </Label>
              <Input 
                id="pays" 
                type="text" 
                placeholder="Pays du fournisseur (optionnel)" 
                {...register("pays")}
                className="h-10"
              />
              {errors.pays && (
                <p className="text-sm text-destructive">{errors.pays.message}</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes
              </Label>
              <Input 
                id="notes" 
                placeholder="Notes additionnelles (optionnel)" 
                {...register("notes")}
                className="h-10"
              />
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
