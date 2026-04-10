"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ModuleSchema } from "@/models/mvc.pruned";
import { updateModuleAction } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Save, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

type FormInput = z.input<typeof ModuleSchema>;
type FormOutput = z.infer<typeof ModuleSchema>;

interface EditFormProps {
  id: string;
  initial: { 
    name: string; 
    type: string;
    description?: string | null; 
    isActive: boolean;
  };
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function EditForm({ id, initial, onCancel, onSuccess }: EditFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [type, setType] = useState(initial.type);
  const [isActive, setIsActive] = useState(initial.isActive);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(ModuleSchema),
    defaultValues: { 
      id,
      name: initial.name, 
      type: initial.type as FormOutput["type"],
      description: initial.description ?? "",
      isActive: initial.isActive,
    },
  });

  const onSubmit = async (data: FormOutput) => {
    setIsSubmitting(true);
    try {
      const res = await updateModuleAction({ ...data, id, type: type as FormOutput["type"] });
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
        description: "Module modifié avec succès" 
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/settings/modules");
      }
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
          <Package className="h-5 w-5 text-primary" />
          Modifier le module
        </CardTitle>
        <CardDescription>
          Mettez à jour les informations du module
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Nom <span className="text-destructive">*</span>
            </Label>
            <Input 
              id="name" 
              placeholder="Ex: Module Finance" 
              {...register("name")}
              className="h-10"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-medium">
              Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={type}
              onValueChange={(value) => {
                setType(value);
                setValue("type", value as FormOutput["type"]);
              }}
            >
              <SelectTrigger id="type" className="h-10">
                <SelectValue placeholder="Sélectionnez un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FINANCE">Finance</SelectItem>
                <SelectItem value="CRM">CRM</SelectItem>
                <SelectItem value="DEPOT_AUTRES">Dépôt Autres</SelectItem>
                <SelectItem value="DEPOT_KALEMIE">Dépôt Kalemie</SelectItem>
                <SelectItem value="DEPOT_LUBUMBASHI">Dépôt Lubumbashi</SelectItem>
                <SelectItem value="DEPOT_KINSHASA">Dépôt Kinshasa</SelectItem>
                <SelectItem value="OPERATION">Opération</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea 
              id="description" 
              placeholder="Description du module (optionnel)" 
              {...register("description")}
              className="min-h-[100px]"
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2 rounded-lg border p-4">
            <Checkbox
              id="isActive"
              checked={isActive}
              onCheckedChange={(checked) => {
                setIsActive(checked === true);
                setValue("isActive", checked === true);
              }}
            />
            <div className="space-y-0.5">
              <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                Module actif
              </Label>
              <p className="text-sm text-muted-foreground">
                Activez ou désactivez ce module
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="flex-1 gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Mise à jour..." : "Mettre à jour le module"}
            </Button>
            {onCancel ? (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Annuler
              </Button>
            ) : (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
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
