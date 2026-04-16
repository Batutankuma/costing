"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateTransporteur } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const TransporteurSchema = z.object({
  id: z.string(),
  nom: z.string().min(1, "Nom requis"),
  description: z.string().optional(),
  adresse: z.string().optional(),
  contactTelephone: z.string().optional(),
  mail: z.string().email("Email invalide").optional().or(z.literal("")),
});

type FormSchema = z.infer<typeof TransporteurSchema>;

interface EditFormProps {
  id: string;
  initial: {
    nom: string;
    description: string;
    adresse: string;
    contactTelephone: string;
    mail: string;
  };
}

export default function EditTransporteurForm({ id, initial }: EditFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormSchema>({
    resolver: zodResolver(TransporteurSchema),
    defaultValues: {
      id,
      nom: initial.nom,
      description: initial.description,
      adresse: initial.adresse,
      contactTelephone: initial.contactTelephone,
      mail: initial.mail,
    },
  });

  const onSubmit = async (data: FormSchema) => {
    setIsSubmitting(true);
    try {
      const result = await updateTransporteur(data);
      if (!result?.data?.success) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result?.data?.failure || "Mise à jour échouée",
        });
        return;
      }
      toast({ title: "Succès", description: "Transporteur modifié avec succès" });
      router.push("/dashboard/transport");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          Modifier le transporteur
        </CardTitle>
        <CardDescription>Mettez à jour les informations du transporteur</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <p className="text-sm text-muted-foreground">
            <span className="text-destructive">*</span> Champs obligatoires
          </p>
          <div className="space-y-2">
            <Label htmlFor="nom">
              Nom <span className="text-destructive">*</span>
            </Label>
            <Input id="nom" required aria-required="true" {...register("nom")} />
            {errors.nom && <p className="text-sm text-destructive">{errors.nom.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register("description")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="adresse">Adresse</Label>
            <Input id="adresse" {...register("adresse")} />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="contactTelephone">Contact téléphone</Label>
              <Input id="contactTelephone" {...register("contactTelephone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mail">Mail</Label>
              <Input id="mail" type="email" {...register("mail")} />
              {errors.mail && <p className="text-sm text-destructive">{errors.mail.message}</p>}
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <Button type="submit" disabled={isSubmitting} className="flex-1 gap-2">
              <Save className="h-4 w-4" />
              {isSubmitting ? "Mise à jour..." : "Mettre à jour le transporteur"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Annuler
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
