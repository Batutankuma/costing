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
  initial: { nom: string; adresse: string };
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
      nom: initial.nom, 
      adresse: initial.adresse 
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
          {/* Nom du fournisseur */}
          <div className="space-y-2">
            <Label htmlFor="nom" className="text-sm font-medium">
              Nom du fournisseur <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="nom" 
              placeholder="Ex: Entreprise ABC" 
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
              placeholder="Adresse complète (optionnel)" 
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


