"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createTransporteur } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Truck } from "lucide-react";
import Link from "next/link";

const CreateTransporteurSchema = z.object({
  nom: z.string().min(1, "Nom requis"),
  description: z.string().optional(),
  adresse: z.string().optional(),
  contactTelephone: z.string().optional(),
  mail: z.string().email("Email invalide").optional().or(z.literal("")),
});

type TransporteurFormData = z.infer<typeof CreateTransporteurSchema>;

export default function CreateTransporteurPage() {
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TransporteurFormData>({
    resolver: zodResolver(CreateTransporteurSchema),
    defaultValues: {
      nom: "",
      description: "",
      adresse: "",
      contactTelephone: "",
      mail: "",
    },
  });

  const onSubmit = async (data: TransporteurFormData) => {
    try {
      const result = await createTransporteur(data);
      if (!result?.data?.success) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result?.data?.failure || "Enregistrement impossible.",
        });
        return;
      }
      toast({
        title: "Succès",
        description: "Transporteur créé avec succès !",
      });
      router.push("/dashboard/transport");
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Une erreur est survenue lors de l'enregistrement.";
      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMessage,
      });
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/transport">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div className="h-6 w-px bg-border" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouveau Transporteur</h1>
          <p className="text-muted-foreground">Ajoutez un nouveau transporteur</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Informations du transporteur
          </CardTitle>
          <CardDescription>Remplissez les informations ci-dessous.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <p className="text-sm text-muted-foreground">
              <span className="text-destructive">*</span> Champs obligatoires
            </p>

            <div className="space-y-2">
              <Label htmlFor="nom">Nom <span className="text-destructive">*</span></Label>
              <Input id="nom" required aria-required="true" {...register("nom")} placeholder="Nom du transporteur" />
              {errors.nom && <p className="text-sm text-destructive">{errors.nom.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...register("description")} placeholder="Description (optionnel)" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input id="adresse" {...register("adresse")} placeholder="Adresse (optionnel)" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="contactTelephone">Contact téléphone</Label>
                <Input id="contactTelephone" {...register("contactTelephone")} placeholder="+243 XXX XXX XXX" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mail">Mail</Label>
                <Input id="mail" type="email" {...register("mail")} placeholder="mail@exemple.com" />
                {errors.mail && <p className="text-sm text-destructive">{errors.mail.message}</p>}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button type="submit" disabled={isSubmitting} className="flex-1 gap-2">
                <Save className="h-4 w-4" />
                {isSubmitting ? "Enregistrement..." : "Enregistrer le transporteur"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Annuler
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
