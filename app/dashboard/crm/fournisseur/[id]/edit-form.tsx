"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FournisseurSchema } from "@/models/mvc";
import { updateAction } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Save, X } from "lucide-react";
import { useState } from "react";

type FormSchema = z.infer<typeof FournisseurSchema>;

interface EditFormProps {
  id: string;
  initial: { 
    company?: string | null;
    contactName?: string | null;
    email?: string | null;
    phone?: string | null;
    adresse?: string | null; 
    rccm?: string | null;
    idNat?: string | null;
    nif?: string | null;
    pays?: string | null;
    notes?: string | null;
  };
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function EditForm({ id, initial, onCancel, onSuccess }: EditFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormSchema>({
    resolver: zodResolver(FournisseurSchema),
    defaultValues: { 
      id,
      company: initial.company ?? "",
      contactName: initial.contactName ?? "",
      email: initial.email ?? "",
      phone: initial.phone ?? "",
      adresse: initial.adresse ?? "",
      rccm: initial.rccm ?? "",
      idNat: initial.idNat ?? "",
      nif: initial.nif ?? "",
      pays: initial.pays ?? "",
      notes: initial.notes ?? "",
    },
  });

  const onSubmit = async (data: FormSchema) => {
    setIsSubmitting(true);
    try {
      const res = await updateAction({ ...data, id });
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
        description: "Fournisseur modifié avec succès" 
      });
      onSuccess?.();
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
          Modifier le fournisseur
        </CardTitle>
        <CardDescription>
          Mettez à jour les informations du fournisseur
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <p className="text-sm text-muted-foreground">
            <span className="text-destructive">*</span> Champs obligatoires
          </p>
          <div className="grid md:grid-cols-2 gap-6">
<<<<<<< HEAD
            {/* Nom du fournisseur */}
            <div className="space-y-2">
              <Label htmlFor="nom" className="text-sm font-medium">
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="nom" 
                placeholder="Ex: Entreprise ABC" 
                required
                aria-required="true"
                {...register("nom")}
                className="h-10"
              />
              {errors.nom && (
                <p className="text-sm text-destructive">{errors.nom.message}</p>
              )}
            </div>

=======
>>>>>>> Autre-Lubumbashi
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
              placeholder="Pays (optionnel)" 
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
              disabled={isSubmitting} 
              className="flex-1 gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Mise à jour..." : "Mettre à jour le fournisseur"}
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


