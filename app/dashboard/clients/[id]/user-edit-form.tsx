"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateClient } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const ClientSchema = z.object({
  id: z.string(),
  company: z.string().min(1, "Société requise"),
  contactName: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  rccm: z.string().optional(),
  idNat: z.string().optional(),
  nif: z.string().optional(),
  notes: z.string().optional(),
});

type FormSchema = z.infer<typeof ClientSchema>;

interface EditFormProps {
  id: string;
  initial: { 
    company: string; 
    contactName: string;
    email: string; 
    phone: string; 
    address: string; 
    notes: string;
    rccm: string;
    idNat: string;
    nif: string;
  };
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
    resolver: zodResolver(ClientSchema),
    defaultValues: { 
      id,
      company: initial.company,
      contactName: initial.contactName,
      email: initial.email,
      phone: initial.phone,
      address: initial.address,
      notes: initial.notes,
      rccm: initial.rccm,
      idNat: initial.idNat,
      nif: initial.nif,
    },
  });

  const onSubmit = async (data: FormSchema) => {
    setIsSubmitting(true);
    try {
      const result = await updateClient({ ...data, id });
      if (!result?.data?.success) {
        toast({ 
          variant: "destructive", 
          title: "Erreur", 
          description: result?.data?.failure || "Mise à jour échouée"
        });
        return;
      }
      toast({ 
        title: "Succès", 
        description: "Client modifié avec succès" 
      });
      router.push(`/dashboard/clients/views/${id}`);
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
          <Users className="h-5 w-5 text-primary" />
          Modifier le client
        </CardTitle>
        <CardDescription>
          Mettez à jour les informations du client
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <p className="text-sm text-muted-foreground">
            <span className="text-destructive">*</span> Champs obligatoires
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium">
                Société <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="company" 
                placeholder="Ex: Entreprise ABC" 
                required
                aria-required="true"
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
          </div>

          <div className="grid md:grid-cols-2 gap-6">
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

          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              Adresse
            </Label>
            <Input 
              id="address" 
              placeholder="Adresse complète (optionnel)" 
              {...register("address")}
              className="h-10"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
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

          <div className="flex gap-3 pt-4 border-t">
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="flex-1 gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Mise à jour..." : "Mettre à jour le client"}
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
