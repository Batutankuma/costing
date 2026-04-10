"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateAction } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, Save, X } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

const equipmentSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  capacity: z.number().min(0, "La capacité doit être positive"),
  currentLevel: z.number().min(0, "Le niveau actuel doit être positif"),
  unit: z.enum(["L", "KG", "G", "ML", "TONNE", "PIECE", "BOITE", "CAISSON"]),
  depotId: z.string().min(1, "Le dépôt est requis").optional(),
  produitId: z.string().optional(),
});

type EquipmentFormData = z.infer<typeof equipmentSchema>;

interface EditFormProps {
  equipment: {
    id: string;
    name: string;
    capacity: number;
    currentLevel: number;
    unit: string;
    depotId?: string | null;
    produitId?: string | null;
  };
}

export default function EditEquipmentForm({ equipment }: EditFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: { 
      name: equipment.name,
      capacity: equipment.capacity,
      currentLevel: equipment.currentLevel,
      unit: equipment.unit as EquipmentFormData['unit'],
      depotId: equipment.depotId || "",
      produitId: equipment.produitId || "",
    },
  });

  const watchedUnit = watch("unit");
  const watchedDepotId = watch("depotId");

  const onSubmit = async (data: EquipmentFormData) => {
    setIsSubmitting(true);
    try {
      const res = await updateAction({ ...data, id: equipment.id });
      
      if (res?.data?.success) {
        toast({ 
          title: "Succès", 
          description: "Équipement modifié avec succès" 
        });
        // Rediriger vers la page de détail
        router.push(`/dashboard/equipment/${equipment.id}`);
      } else {
        toast({ 
          variant: "destructive", 
          title: "Erreur", 
          description: res?.data?.failure || res?.serverError || "Mise à jour échouée" 
        });
      }
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
          <Droplets className="h-5 w-5 text-primary" />
          Modifier l&apos;équipement
        </CardTitle>
        <CardDescription>
          Modifiez les informations de l&apos;équipement. Les champs marqués d&apos;un * sont obligatoires.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nom de l'équipement */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nom de l&apos;équipement <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Entrez le nom de l'équipement"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Capacité */}
          <div className="space-y-2">
            <Label htmlFor="capacity">
              Capacité <span className="text-red-500">*</span>
            </Label>
            <Input
              id="capacity"
              type="number"
              step="0.01"
              min="0"
              {...register("capacity", { valueAsNumber: true })}
              placeholder="Capacité de l'équipement"
              className={errors.capacity ? "border-red-500" : ""}
            />
            {errors.capacity && (
              <p className="text-sm text-red-500">{errors.capacity.message}</p>
            )}
          </div>

          {/* Niveau actuel */}
          <div className="space-y-2">
            <Label htmlFor="currentLevel">
              Niveau actuel <span className="text-red-500">*</span>
            </Label>
            <Input
              id="currentLevel"
              type="number"
              step="0.01"
              min="0"
              {...register("currentLevel", { valueAsNumber: true })}
              placeholder="Niveau actuel"
              className={errors.currentLevel ? "border-red-500" : ""}
            />
            {errors.currentLevel && (
              <p className="text-sm text-red-500">{errors.currentLevel.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Le niveau actuel ne peut pas dépasser la capacité
            </p>
          </div>

          {/* Unité */}
          <div className="space-y-2">
            <Label htmlFor="unit">
              Unité <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watchedUnit}
              onValueChange={(value: EquipmentFormData['unit']) => setValue("unit", value)}
            >
              <SelectTrigger className={errors.unit ? "border-red-500" : ""}>
                <SelectValue placeholder="Sélectionnez l&apos;unité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Litre (L)</SelectItem>
                <SelectItem value="KG">Kilogramme (KG)</SelectItem>
                <SelectItem value="G">Gramme (G)</SelectItem>
                <SelectItem value="ML">Millilitre (ML)</SelectItem>
                <SelectItem value="TONNE">Tonne</SelectItem>
                <SelectItem value="PIECE">Pièce</SelectItem>
                <SelectItem value="BOITE">Boîte</SelectItem>
                <SelectItem value="CAISSON">Caisson</SelectItem>
              </SelectContent>
            </Select>
            {errors.unit && (
              <p className="text-sm text-red-500">{errors.unit.message}</p>
            )}
          </div>

          {/* Dépôt */}
          <div className="space-y-2">
            <Label htmlFor="depotId">
              Dépôt <span className="text-red-500">*</span>
            </Label>
            <Input
              id="depotId"
              {...register("depotId")}
              placeholder="ID du dépôt"
              className={errors.depotId ? "border-red-500" : ""}
            />
            {errors.depotId && (
              <p className="text-sm text-red-500">{errors.depotId.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Entrez l&apos;ID du dépôt où se trouve cet équipement
            </p>
          </div>

          {/* Produit */}
          <div className="space-y-2">
            <Label htmlFor="produitId">Produit (optionnel)</Label>
            <Input
              id="produitId"
              {...register("produitId")}
              placeholder="ID du produit (optionnel)"
              className={errors.produitId ? "border-red-500" : ""}
            />
            {errors.produitId && (
              <p className="text-sm text-red-500">{errors.produitId.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Laissez vide si aucun produit n&apos;est assigné
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/equipment/${equipment.id}`)}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
