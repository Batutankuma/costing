"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createTransportRate } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Truck, Save } from "lucide-react";
import Link from "next/link";

const CreateTransportRateSchema = z.object({
  destination: z.string().min(1, "Destination requise"),
  rateUsdPerCbm: z.number().min(0, "Le tarif doit être positif"),
});

type TransportRateFormData = z.infer<typeof CreateTransportRateSchema>;

export default function CreateTransportRatePage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TransportRateFormData>({
    resolver: zodResolver(CreateTransportRateSchema),
    defaultValues: {
      destination: "",
      rateUsdPerCbm: 0,
    }
  });

  const onSubmit = async (data: TransportRateFormData) => {
    try {
      const result = await createTransportRate(data);
      if (result.data?.failure) {
        toast({ 
          variant: "destructive",
          title: "Erreur", 
          description: result.data.failure 
        });
        return;
      }
      toast({ 
        title: "Succès", 
        description: "Tarif de transport créé avec succès !" 
      });
      router.push(`/dashboard/transport-rates`);
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
        <Link href="/dashboard/transport-rates">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div className="h-6 w-px bg-border" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouveau Tarif de Transport</h1>
          <p className="text-muted-foreground">
            Ajoutez un nouveau tarif de transport à votre base de données
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Informations du tarif
          </CardTitle>
          <CardDescription>
            Remplissez les informations ci-dessous pour créer un nouveau tarif de transport
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="destination" className="text-sm font-medium">
                Destination <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="destination" 
                placeholder="Ex: Likasi, Kolwezi, Lubumbashi..." 
                {...register("destination")}
                className="h-10"
              />
              {errors.destination && (
                <p className="text-sm text-destructive">{errors.destination.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rateUsdPerCbm" className="text-sm font-medium">
                Tarif (USD/CBM) <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="rateUsdPerCbm" 
                type="number" 
                step="0.01"
                placeholder="Ex: 50.00" 
                {...register("rateUsdPerCbm", { valueAsNumber: true })}
                className="h-10"
              />
              {errors.rateUsdPerCbm && (
                <p className="text-sm text-destructive">{errors.rateUsdPerCbm.message}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="flex-1 gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? "Enregistrement..." : "Enregistrer le tarif"}
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

