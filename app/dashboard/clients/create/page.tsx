"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createClient } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Users, Save } from "lucide-react";
import Link from "next/link";

const CreateClientSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  company: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  rccm: z.string().optional(),
  idNat: z.string().optional(),
  nif: z.string().optional(),
  notes: z.string().optional(),
});

type ClientFormData = z.infer<typeof CreateClientSchema>;

export default function CreateClientPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(CreateClientSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      address: "",
      rccm: "",
      idNat: "",
      nif: "",
      notes: "",
    }
  });

  const onSubmit = async (data: ClientFormData) => {
    try {
      const result = await createClient(data);
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
        description: "Client créé avec succès !" 
      });
      router.push(`/dashboard/clients`);
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
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div className="h-6 w-px bg-border" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouveau Client</h1>
          <p className="text-muted-foreground">
            Ajoutez un nouveau client à votre base de données
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Informations du client
          </CardTitle>
          <CardDescription>
            Remplissez les informations ci-dessous pour créer un nouveau client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Nom <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="name" 
                  placeholder="Ex: Entreprise ABC, Jean Dupont..." 
                  {...register("name")}
                  className="h-10"
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-medium">
                  Société
                </Label>
                <Input 
                  id="company" 
                  placeholder="Nom de la société (optionnel)" 
                  {...register("company")}
                  className="h-10"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
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
                  Téléphone
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
                {isSubmitting ? "Enregistrement..." : "Enregistrer le client"}
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


