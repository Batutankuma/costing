"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FournisseurSchema } from "@/models/mvc";
import { updateFournisseur } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type FormSchema = z.infer<typeof FournisseurSchema>;

interface EditFormProps {
  id: string;
  initial: { company: string; contactName: string; phone: string; email: string; adresse: string };
}

export default function EditForm({ id, initial }: EditFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormSchema>({
    resolver: zodResolver(FournisseurSchema),
    defaultValues: { 
      id,
      company: initial.company,
      contactName: initial.contactName,
      phone: initial.phone,
      email: initial.email,
      adresse: initial.adresse,
    },
  });

  const onSubmit = async (data: FormSchema) => {
    setIsSubmitting(true);
    try {
      const result = await updateFournisseur({ ...data, id });
      if (!result || result?.data?.failure) {
        toast({ 
          variant: "destructive", 
          title: "Erreur", 
          description: result?.data?.failure || "Mise à jour échouée"
        });
        return;
      }
      toast({ 
        title: "Succès", 
        description: "Fournisseur modifié avec succès" 
      });
      router.push(`/dashboard/fournisseurs/views/${id}`);
    } catch (error) {
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
            <Input id="contactName" placeholder="Ex: Jean Dupont" {...register("contactName")} className="h-10" />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">Téléphone du contact</Label>
              <Input id="phone" placeholder="+243 XXX XXX XXX" {...register("phone")} className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email du contact</Label>
              <Input id="email" type="email" placeholder="contact@societe.com" {...register("email")} className="h-10" />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
          </div>

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

          <div className="flex gap-3 pt-4 border-t">
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="flex-1 gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Mise à jour..." : "Mettre à jour le fournisseur"}
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
  );
}

