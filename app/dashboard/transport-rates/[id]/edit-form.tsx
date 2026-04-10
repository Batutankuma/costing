"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateTransportRate } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const TransportRateSchema = z.object({
  id: z.string(),
  destination: z.string().min(1, "Destination requise"),
  rateUsdPerCbm: z.number().min(0, "Le tarif doit être positif"),
});

type FormSchema = z.infer<typeof TransportRateSchema>;

interface EditFormProps {
  id: string;
  initial: { destination: string; rateUsdPerCbm: number };
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
    resolver: zodResolver(TransportRateSchema),
    defaultValues: { 
      id,
      destination: initial.destination, 
      rateUsdPerCbm: initial.rateUsdPerCbm 
    },
  });

  const onSubmit = async (data: FormSchema) => {
    setIsSubmitting(true);
    try {
      const result = await updateTransportRate({ ...data, id });
      if (result?.data?.failure) {
        toast({ 
          variant: "destructive", 
          title: "Erreur", 
          description: result.data.failure || "Mise à jour échouée"
        });
        return;
      }
      toast({ 
        title: "Succès", 
        description: "Tarif de transport modifié avec succès" 
      });
      router.push(`/dashboard/transport-rates/views/${id}`);
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
          <Truck className="h-5 w-5 text-primary" />
          Modifier le tarif de transport
        </CardTitle>
        <CardDescription>
          Mettez à jour les informations du tarif
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
              placeholder="Ex: Likasi, Kolwezi..." 
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
              {isSubmitting ? "Mise à jour..." : "Mettre à jour le tarif"}
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

