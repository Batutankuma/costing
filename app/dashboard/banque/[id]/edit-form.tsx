"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { BanqueSchema } from "@/models/mvc";
import { updateBanque } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Save, X } from "lucide-react";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";

type FormSchema = z.infer<typeof BanqueSchema>;

interface EditFormProps {
  id: string;
  initial: { 
    nom: string; 
    numeroCompte: string;
    devise: "XOF" | "USD" | "EUR" | "CDF";
    swift?: string | null;
    mailGestionnaire?: string | null;
    contactGestionnaire?: string | null;
  };
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function EditForm({ id, initial, onCancel, onSuccess }: EditFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormSchema>({
    resolver: zodResolver(BanqueSchema),
    defaultValues: { 
      id,
      nom: initial.nom, 
      numeroCompte: initial.numeroCompte,
      devise: initial.devise as "XOF" | "USD" | "EUR" | "CDF",
      swift: initial.swift ?? "",
      mailGestionnaire: initial.mailGestionnaire ?? "",
      contactGestionnaire: initial.contactGestionnaire ?? "",
    },
  });

  const onSubmit = async (data: FormSchema) => {
    setIsSubmitting(true);
    try {
      const res = await updateBanque({ ...data, id });
      if (!res?.data?.success) {
        toast({ 
          variant: "destructive", 
          title: "Erreur", 
          description: res?.data?.failure || "Mise à jour échouée" 
        });
        return;
      }
      toast({ 
        title: "Succès", 
        description: "Banque modifiée avec succès" 
      });
      onSuccess?.();
      router.push("/dashboard/banque");
    } catch {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: "Une erreur est survenue lors de la mise à jour" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Modifier la banque
        </CardTitle>
        <CardDescription>
          Mettez à jour les informations de la banque
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
                placeholder="Ex: Banque Commerciale du Congo" 
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
              {isSubmitting ? "Mise à jour..." : "Mettre à jour la banque"}
            </Button>
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Annuler
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
