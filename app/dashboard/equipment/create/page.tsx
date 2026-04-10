"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreateEquipmentSchema } from "@/models/mvc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import { createAction } from "../actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Droplets, Save } from "lucide-react";
import { listDepots } from "../../depots/actions";
import { listProducts } from "../../products/actions";
import { useAction } from "next-safe-action/hooks";
import { Progress } from "@/components/progress";

type EquipmentFormData = z.input<typeof CreateEquipmentSchema>;

export default function CreateEquipmentPage() {
  type DepotRef = { id: string; name: string };
  type ProduitRef = { id: string; name: string; unit?: string; code?: string | null };
  const [depots, setDepots] = useState<DepotRef[]>([]);
  const [produits, setProduits] = useState<ProduitRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const handledRedirect = useRef(false);

  const depotsAct = useAction(listDepots);
  const produitsAct = useAction(listProducts);
  const createAct = useAction(createAction);

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    setValue,
    watch,
    trigger
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(CreateEquipmentSchema),
    defaultValues: {
      name: "",
      capacity: 0,
      currentLevel: 0,
      unit: "L",
      depotId: "",
      produitId: undefined,
    }
  });

  const capacity = watch("capacity");
  const currentLevel = watch("currentLevel") ?? 0;
  const selectedDepotId = watch("depotId");
  const isDepotAvailable = depots.length > 0;
  const fillPercent = capacity > 0 ? Math.min(100, Math.max(0, (currentLevel / capacity) * 100)) : 0;

 

  // Charger les données de référence
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);
        const timer = setTimeout(() => {
          if (isMounted) setLoading(false);
        }, 7000);
        const [depotsRes, produitsRes] = await Promise.all([
          depotsAct.executeAsync(),
          produitsAct.executeAsync(),
        ]);
        clearTimeout(timer);
        if (!isMounted) return;
        if (depotsRes?.data?.data) {
          const list = depotsRes.data.data as DepotRef[];
          if (isMounted) setDepots(list);
          if (list.length > 0) {
            const qpDepotId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('depotId') : null;
            const selectedId = qpDepotId && list.some(d => d.id === qpDepotId) ? qpDepotId : list[0].id;
            setValue("depotId", selectedId);
          }
        }
        if (produitsRes?.data?.data) {
          if (isMounted) setProduits(produitsRes.data.data as ProduitRef[]);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données" });
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle redirect back from depot creation
  useEffect(() => {
    if (handledRedirect.current) return;
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const created = params?.get('created');
    if (created === 'depot') {
      handledRedirect.current = true;
      toast({ title: 'Succès', description: 'Dépôt créé. Vous pouvez maintenant créer un Equipment.' });
      // refresh depots
      (async () => {
        const res = await depotsAct.executeAsync();
        if (res?.data?.data) {
          const list = res.data.data as DepotRef[];
          setDepots(list);
          if (list.length > 0) setValue('depotId', list[0].id);
        }
      })();
      // remove the query param(s)
      const url = new URL(window.location.href);
      url.searchParams.delete('created');
      url.searchParams.delete('depotId');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // Validation en temps réel pour le niveau actuel
  useEffect(() => {
    if (capacity > 0 && currentLevel > capacity) {
      trigger("currentLevel");
    }
  }, [capacity, currentLevel, trigger]);

  const onSubmit = async (data: EquipmentFormData) => {
    try {
      setSubmitting(true);
      
      // Validate depot selection before submission
      if (!data.depotId || data.depotId === "") {
        toast({ 
          variant: "destructive", 
          title: "Erreur", 
          description: "Veuillez sélectionner un dépôt" 
        });
        return;
      }
      
      
      const result = await createAct.executeAsync(data);

      if (result?.data?.success) {
        toast({ 
          title: "Succès", 
          description: "Equipment créé avec succès !" 
        });
        router.push(`/dashboard/equipment`);
      } else {
        const message = result?.data?.failure || "Erreur inconnue lors de l'enregistrement.";
        throw new Error(message);
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Une erreur est survenue lors de l'enregistrement.";
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: errorMessage
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Chargement des données...</p>
          </div>
        </div>
      </div>
    );
  }

  const hasErrors = Object.keys(errors).length > 0;
  const isFormInvalid = hasErrors || !isDepotAvailable || capacity <= 0 || (capacity > 0 && currentLevel > capacity);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header avec navigation */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <div className="h-6 w-px bg-border" />
        <div>
          <h1 className="text-2xl font-semibold">Nouveau Equipment</h1>
          <p className="text-sm text-muted-foreground">
            Créez un nouveau Equipment pour stocker vos produits
          </p>
        </div>
      </div>

      {/* Formulaire dans une Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            Informations du Equipment
          </CardTitle>
          <CardDescription>
            Remplissez les informations ci-dessous pour créer un nouveau Equipment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {!isDepotAvailable && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 flex items-center justify-between gap-3">
                <span>Aucun dépôt disponible. Veuillez créer un dépôt avant d&apos;ajouter un Equipment.</span>
                <Button size="sm" variant="outline" onClick={() => router.push('/dashboard/stock/depot/create')}>
                  Créer un dépôt
                </Button>
              </div>
            )}
            {/* Nom du Equipment */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nom du Equipment <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="name" 
                placeholder="Ex: Equipment Principal, Equipment de Réserve..." 
                aria-invalid={!!errors.name}
                {...register("name")}
                className="h-10"
                disabled={submitting}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Capacité */}
            <div className="space-y-2">
              <Label htmlFor="capacity" className="text-sm font-medium">
                Capacité <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="capacity" 
                type="number" 
                min="0" 
                step="0.01" 
                placeholder="0" 
                aria-invalid={!!errors.capacity}
                {...register("capacity", { valueAsNumber: true })}
                className="h-10"
                disabled={submitting}
              />
              {errors.capacity && (
                <p className="text-sm text-destructive">{errors.capacity.message}</p>
              )}
            </div>

            {/* Niveau actuel */}
            <div className="space-y-2">
              <Label htmlFor="currentLevel" className="text-sm font-medium">
                Niveau actuel <span className="text-destructive">*</span>
                {capacity > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (max: {capacity})
                  </span>
                )}
              </Label>
              <Input 
                id="currentLevel" 
                type="number" 
                min="0" 
                max={capacity || undefined}
                step="0.01" 
                placeholder="0" 
                aria-invalid={!!errors.currentLevel}
                {...register("currentLevel", { valueAsNumber: true })}
                className="h-10"
                disabled={submitting}
              />
              {capacity > 0 && currentLevel > capacity && (
                <p className="text-sm text-destructive">Le niveau ne peut pas dépasser la capacité.</p>
              )}
              <div className="space-y-1">
                <Progress value={fillPercent} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Remplissage: {fillPercent.toFixed(0)}%
                </p>
              </div>
              {errors.currentLevel && (
                <p className="text-sm text-destructive">{errors.currentLevel.message}</p>
              )}
            </div>

            {/* Unité */}
            <div className="space-y-2">
              <Label htmlFor="unit" className="text-sm font-medium">
                Unité <span className="text-destructive">*</span>
              </Label>
              <Select
                onValueChange={(value: string) => setValue("unit", value as EquipmentFormData['unit'])}
                defaultValue="L"
              >
                <SelectTrigger id="unit" className="h-10">
                  <SelectValue placeholder="Sélectionner une unité" />
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
                <p className="text-sm text-destructive">{errors.unit.message}</p>
              )}
            </div>

            {/* Dépôt */}
            <div className="space-y-2">
              <Label htmlFor="depotId" className="text-sm font-medium">
                Dépôt <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedDepotId || ""}
                onValueChange={(value: string) => {
                  setValue("depotId", value);
                }}
              >
                <SelectTrigger id="depotId" className="h-10" disabled={!isDepotAvailable || submitting}>
                  <SelectValue placeholder="Sélectionner un dépôt" />
                </SelectTrigger>
                <SelectContent>
                  {depots.map((depot) => (
                    <SelectItem key={depot.id} value={depot.id}>
                      {depot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedDepotId && (
                <p className="text-xs text-muted-foreground">Dépôt sélectionné: {selectedDepotId}</p>
              )}
              {errors.depotId && (
                <p className="text-sm text-destructive">{errors.depotId.message}</p>
              )}
            </div>

            {/* Produit */}
            <div className="space-y-2">
              <Label htmlFor="produitId" className="text-sm font-medium">
                Produit (optionnel)
              </Label>
              <Select
                onValueChange={(value: string) => setValue("produitId", value === "none" ? undefined : value)}
              >
                <SelectTrigger id="produitId" className="h-10" disabled={submitting}>
                  <SelectValue placeholder="Sélectionner un produit (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun produit</SelectItem>
                  {produits.map((produit) => (
                    <SelectItem key={produit.id} value={produit.id}>
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{produit.name}</span>
                        {produit.unit && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{produit.unit}</span>
                        )}
                        {produit.code && (
                          <span className="text-xs text-muted-foreground">{produit.code}</span>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.produitId && (
                <p className="text-sm text-destructive">{errors.produitId.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                type="submit" 
                className="flex-1 gap-2"
                disabled={submitting || isFormInvalid}
                title={isFormInvalid ? "Veuillez corriger les erreurs avant de soumettre." : ""}
              >
                <Save className="h-4 w-4" />
                {submitting ? "Création..." : "Créer le Equipment"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
                disabled={submitting}
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
