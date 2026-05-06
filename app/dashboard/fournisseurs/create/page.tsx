"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createFournisseur } from "../actions";
import { CreateFournisseurSchema } from "@/models/mvc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Building2, Save } from "lucide-react";
import Link from "next/link";

type FournisseurFormData = z.infer<typeof CreateFournisseurSchema>;

export default function CreateFournisseurPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FournisseurFormData>({
    resolver: zodResolver(CreateFournisseurSchema),
    defaultValues: {
      company: "",
      contactName: "",
      email: "",
      phone: "",
      adresse: "",
    }
  });

  const onSubmit = async (data: FournisseurFormData) => {
    try {
      const result = await createFournisseur(data);
      if (!result || result?.data?.failure) {
        toast({ 
          variant: "destructive",
          title: "Erreur", 
          description: result?.data?.failure ?? "Mise à jour échouée"
        });
        return;
      }
      toast({ 
        title: "Succès", 
        description: "Fournisseur créé avec succès !" 
      });
      router.push(`/dashboard/fournisseurs`);
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
        <Link href="/dashboard/fournisseurs">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div className="h-6 w-px bg-border" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouveau Fournisseur</h1>
          <p className="text-muted-foreground">
            Ajoutez un nouveau fournisseur à votre base de données
          </p>
        </div>
      </div>

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
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">Téléphone du contact</Label>
                <Input id="phone" placeholder="+243 XXX XXX XXX" {...register("phone")} className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email du contact</Label>
                <Input id="email" type="email" placeholder="contact@societe.com" {...register("email")} className="h-10" />
              </div>
            </div>

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

            <div className="flex gap-3 pt-4 border-t">
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="flex-1 gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? "Enregistrement..." : "Enregistrer le fournisseur"}
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

