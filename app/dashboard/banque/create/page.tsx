"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createBanque } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Building2, Save } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Controller } from "react-hook-form";
import { CreateBanqueSchema } from "@/models/mvc";

type BanqueFormData = z.infer<typeof CreateBanqueSchema>;

export default function CreateBanquePage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BanqueFormData>({
    resolver: zodResolver(CreateBanqueSchema),
    defaultValues: {
      nom: "",
      numeroCompte: "",
      devise: "USD",
      swift: "",
      nomGestionnaire: "",
      mailGestionnaire: "",
      contactGestionnaire: "",
    }
  });

  const onSubmit = async (data: BanqueFormData) => {
    try {
      const result = await createBanque(data);
      if (!result?.data?.success) {
        toast({ 
          variant: "destructive",
          title: "Erreur", 
          description: result?.data?.failure || "Enregistrement impossible."
        });
        return;
      }
      toast({ 
        title: "Succès", 
        description: "Banque créée avec succès !" 
      });
      router.push(`/dashboard/banque`);
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
        <Link href="/dashboard/banque">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div className="h-6 w-px bg-border" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouvelle Banque</h1>
          <p className="text-muted-foreground">
            Ajoutez une nouvelle banque à votre base de données
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Informations de la banque
          </CardTitle>
          <CardDescription>
            Remplissez les informations ci-dessous pour créer une nouvelle banque
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <p className="text-sm text-muted-foreground">
              <span className="text-destructive">*</span> Champs obligatoires
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nom" className="text-sm font-medium">
                  Nom <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="nom" 
                  placeholder="Ex: Banque Commerciale du Congo..." 
                  required
                  aria-required="true"
                  {...register("nom")}
                  className="h-10"
                />
                {errors.nom && (
                  <p className="text-sm text-destructive">{errors.nom.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroCompte" className="text-sm font-medium">
                  Numéro de Compte <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="numeroCompte" 
                  placeholder="Numéro de compte bancaire" 
                  required
                  aria-required="true"
                  {...register("numeroCompte")}
                  className="h-10"
                />
                {errors.numeroCompte && (
                  <p className="text-sm text-destructive">{errors.numeroCompte.message}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="devise" className="text-sm font-medium">
                  Devise <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="devise"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Sélectionner une devise" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - Dollar US</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="CDF">CDF - Franc Congolais</SelectItem>
                        <SelectItem value="XOF">XOF - Franc CFA</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.devise && (
                  <p className="text-sm text-destructive">{errors.devise.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="swift" className="text-sm font-medium">
                  SWIFT
                </Label>
                <Input 
                  id="swift" 
                  placeholder="Code SWIFT (optionnel)" 
                  {...register("swift")}
                  className="h-10"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nomGestionnaire" className="text-sm font-medium">
                  Nom du Gestionnaire
                </Label>
                <Input
                  id="nomGestionnaire"
                  placeholder="Nom complet du gestionnaire"
                  {...register("nomGestionnaire")}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mailGestionnaire" className="text-sm font-medium">
                  Email du Gestionnaire
                </Label>
                <Input 
                  id="mailGestionnaire" 
                  type="email" 
                  placeholder="email@exemple.com" 
                  {...register("mailGestionnaire")}
                  className="h-10"
                />
                {errors.mailGestionnaire && (
                  <p className="text-sm text-destructive">{errors.mailGestionnaire.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactGestionnaire" className="text-sm font-medium">
                  Contact du Gestionnaire
                </Label>
                <Input 
                  id="contactGestionnaire" 
                  placeholder="+243 XXX XXX XXX" 
                  {...register("contactGestionnaire")}
                  className="h-10"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="flex-1 gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? "Enregistrement..." : "Enregistrer la banque"}
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
