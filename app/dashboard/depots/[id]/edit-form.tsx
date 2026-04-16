"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { updateDepot } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Warehouse, Save, X } from "lucide-react";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";

const depotSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  address: z.string().min(1, "L'adresse est requise"),
  capacity: z.number().min(0, "La capacité doit être positive").optional(),
  type: z.enum(["OWNED", "EXTERNAL"]),
  status: z.boolean(),
});

type DepotFormData = z.infer<typeof depotSchema>;

interface EditFormProps {
  depot: {
    id: string;
    name: string;
    address: string;
    capacity?: number;
    type: "OWNED" | "EXTERNAL";
    status: boolean;
  };
}

export default function EditDepotForm({ depot }: EditFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<DepotFormData>({
    resolver: zodResolver(depotSchema),
    defaultValues: { 
      name: depot.name,
      address: depot.address,
      capacity: depot.capacity,
      type: depot.type,
      status: depot.status,
    },
  });

  const watchedType = watch("type");
  const watchedStatus = watch("status");

  const onSubmit = async (data: DepotFormData) => {
    setIsSubmitting(true);
    try {
      const res = await updateDepot({ 
        id: depot.id, 
        name: data.name, 
        type: data.type, 
        location: data.address 
      });
      
      if (res?.data?.success) {
        toast({ 
          title: "Succès", 
          description: "Dépôt modifié avec succès" 
        });
        // Rediriger vers la page de détail
        router.push(`/dashboard/depots/views/${depot.id}`);
      } else {
        toast({ 
          variant: "destructive", 
          title: "Erreur", 
          description: (res as any)?.data?.failure || "Mise à jour échouée" 
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
          <Warehouse className="h-5 w-5 text-primary" />
          Modifier le dépôt
        </CardTitle>
        <CardDescription>
          Modifiez les informations du dépôt. Les champs marqués d&apos;un * sont obligatoires.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Nom du dépôt */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nom du dépôt <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Entrez le nom du dépôt"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Adresse */}
          <div className="space-y-2">
            <Label htmlFor="address">
              Adresse <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="Entrez l'adresse complète"
              className={errors.address ? "border-red-500" : ""}
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address.message}</p>
            )}
          </div>

          {/* Capacité */}
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacité</Label>
            <Input
              id="capacity"
              type="number"
              step="0.01"
              min="0"
              {...register("capacity", { 
                setValueAs: (v) => {
                  if (v === "" || v === null || typeof v === "undefined") return undefined;
                  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
                  return Number.isFinite(n) ? n : undefined;
                },
              })}
              placeholder="Capacité du dépôt"
              className={errors.capacity ? "border-red-500" : ""}
            />
            {errors.capacity && (
              <p className="text-sm text-red-500">{errors.capacity.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Laissez vide si la capacité n&apos;est pas applicable
            </p>
          </div>

          {/* Type de dépôt */}
          <div className="space-y-2">
            <Label htmlFor="type">
              Type de dépôt <span className="text-red-500">*</span>
            </Label>
            <Select
              value={watchedType}
              onValueChange={(value: "OWNED" | "EXTERNAL") => setValue("type", value, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
            >
              <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                <SelectValue placeholder="Sélectionnez le type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OWNED">Dépôt Interne</SelectItem>
                <SelectItem value="EXTERNAL">Dépôt Externe</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              {watchedType === "OWNED" 
                ? "Dépôt appartenant à l'entreprise" 
                : "Dépôt externe partenaire"}
            </p>
          </div>

          {/* Statut */}
          <div className="space-y-2">
            <Label htmlFor="status">Statut du dépôt</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="status"
                checked={watchedStatus}
                onCheckedChange={(checked) => setValue("status", Boolean(checked), { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
              />
              <Label htmlFor="status">
                {watchedStatus ? "Actif" : "Inactif"}
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Un dépôt inactif ne peut pas recevoir de nouveaux stocks
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/depots/views/${depot.id}`)}
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