"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CreateCommandeSchema } from "@/models/mvc";
import { findByIdAction, updateAction } from "../actions";
import { z } from "zod";
import { Loader2, ArrowLeft, Calculator, Package, Building2, CreditCard, DollarSign, FileText } from "lucide-react";
import { useAction } from "next-safe-action/hooks";

// Import des actions pour récupérer les données
import { listProducts } from "@/app/dashboard/products/actions";
import { findAllAction as findAllFournisseurs } from "@/app/dashboard/crm/fournisseur/actions";
import { listDepots } from "@/app/dashboard/depots/actions";

// Type pour le formulaire qui correspond exactement au schéma
type CommandeForm = z.input<typeof CreateCommandeSchema>;

export default function EditCommandePage({ params }: { params: Promise<{ id: string }> }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [commandeId, setCommandeId] = useState<string | null>(null);
  type ProduitRef = { id: string; name: string };
  type FournisseurRef = { id: string; nom: string };
  type DepotRef = { id: string; name: string };
  const [produits, setProduits] = useState<ProduitRef[]>([]);
  const [fournisseurs, setFournisseurs] = useState<FournisseurRef[]>([]);
  const [depots, setDepots] = useState<DepotRef[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // État simplifié pour les valeurs sélectionnées
  const [selectedValues, setSelectedValues] = useState<{
    status: "DRAFT" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "PARTIALLY_RECEIVED" | "";
    produitId: string;
    depotId: string;
    fournisseurId: string;
    devise: "XOF" | "USD" | "EUR" | "CDF" | "";
  }>({
    status: "",
    produitId: "",
    depotId: "",
    fournisseurId: "",
    devise: "",
  });
  
  const router = useRouter();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CommandeForm>({
    resolver: zodResolver(CreateCommandeSchema),
    defaultValues: {
      status: "DRAFT",
      reference: "",
      date: new Date(),
      produitId: "",
      depotId: "",
      devise: "USD",
      fournisseurId: "",
      quantite: 0,
      unitPrice: 0,
    },
  });

  // Helper pour formater la date pour l'input HTML
  const formatDateForInput = (date: Date | string | null | undefined): string => {
    if (!date) return new Date().toISOString().split('T')[0];
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split('T')[0];
  };

  // Watch pour les calculs en temps réel
  const watchedQuantite = watch("quantite");
  const watchedUnitPrice = watch("unitPrice");
  const watchedDevise = watch("devise");

  // Calcul du prix total
  const totalPrice = useMemo(() => {
    if (watchedQuantite && watchedUnitPrice) {
      return (watchedQuantite * watchedUnitPrice).toFixed(2);
    }
    return "0.00";
  }, [watchedQuantite, watchedUnitPrice]);

  // Get params asynchronously
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setCommandeId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  // Hooks pour les actions de récupération
  const { executeAsync: executeProduits } = useAction(listProducts);
  const { executeAsync: executeFournisseurs } = useAction(findAllFournisseurs);
  const { executeAsync: executeDepots } = useAction(listDepots);
  const { executeAsync: executeUpdate } = useAction(updateAction);

  // Charger les données de référence
  useEffect(() => {
    let isMounted = true;
    
    const loadReferenceData = async () => {
      try {
        if (!isMounted) return;
        setLoadingData(true);
        
        // Charger les données en parallèle
        const [produitsResult, fournisseursResult, depotsResult] = await Promise.all([
          executeProduits(),
          executeFournisseurs(),
          executeDepots(),
        ]);
        
        if (!isMounted) return;
        
        // Charger les produits
        const produitsData = produitsResult?.data?.data ?? [];
        setProduits(produitsData || []);

        // Charger les fournisseurs
        if (fournisseursResult?.data?.success && fournisseursResult.data.result) {
          setFournisseurs(fournisseursResult.data.result || []);
        }

        // Charger les dépôts
        const depotsData = depotsResult?.data?.data ?? [];
        setDepots(depotsData || []);
      } catch (error) {
        if (!isMounted) return;
        console.error("Erreur lors du chargement des données de référence:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les données de référence"
        });
      } finally {
        if (isMounted) {
          setLoadingData(false);
        }
      }
    };

    loadReferenceData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Charger une seule fois au montage

  useEffect(() => {
    let isMounted = true;

    const fetchCommande = async (entityId: string) => {
      if (!isMounted) return;
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await findByIdAction(entityId);
        if (!isMounted) return;
        
        if (result.success && result.result) {
          const entity = result.result;
          
          // Mettre à jour les valeurs du formulaire
          setValue("status", entity.status);
          setValue("reference", entity.reference);
          // Formater la date pour l'input HTML date (YYYY-MM-DD)
          const dateValue = entity.date ? new Date(entity.date) : new Date();
          setValue("date", dateValue);
          setValue("produitId", entity.produitId ?? "");
          setValue("depotId", entity.depotId ?? "");
          setValue("devise", entity.devise ?? "USD");
          setValue("fournisseurId", entity.fournisseurId ?? "");
          setValue("quantite", entity.quantite);
          setValue("unitPrice", entity.unitPrice ?? 0);
          
          // Mettre à jour l'état des valeurs sélectionnées
          if (isMounted) {
            setSelectedValues({
              status: entity.status,
              produitId: entity.produitId ?? "",
              depotId: entity.depotId ?? "",
              fournisseurId: entity.fournisseurId ?? "",
              devise: entity.devise ?? "USD",
            });
          }
        } else {
          if (!isMounted) return;
          const msg = result.failure || "Commande introuvable.";
          setErrorMessage(msg);
          toast({
            variant: "destructive",
            title: "Erreur",
            description: msg,
          });
          setTimeout(() => {
            if (isMounted) {
              router.push(`/dashboard/commande`);
            }
          }, 2000); 
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Erreur lors du chargement de la commande:", error);
        setErrorMessage("Impossible de charger la commande. Veuillez réessayer.");
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger la commande.",
        });
        setTimeout(() => {
          if (isMounted) {
            router.push(`/dashboard/commande`);
          }
        }, 2000); 
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (commandeId) {
      fetchCommande(commandeId);
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commandeId]); // Seulement commandeId comme dépendance

  

  const onSubmit = async (data: CommandeForm) => {
  
    try {
      if (!commandeId) {
        console.error("[EDIT-COMMANDE] ❌ ID de commande manquant");
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "ID de commande manquant",
        });
        return;
      }

      // Validation des champs requis
      if (!data.reference || data.reference.trim() === "") {
        console.error("[EDIT-COMMANDE] ❌ Référence manquante");
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "La référence est requise",
        });
        return;
      }

      if (!data.produitId || data.produitId.trim() === "") {
        console.error("[EDIT-COMMANDE] ❌ Produit manquant");
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Le produit est requis",
        });
        return;
      }

      if (!data.quantite || data.quantite <= 0) {
        console.error("[EDIT-COMMANDE] ❌ Quantité invalide");
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "La quantité doit être supérieure à 0",
        });
        return;
      }

      // Préparer les données pour la mise à jour
      const dateValue = data.date instanceof Date 
        ? data.date 
        : typeof data.date === 'string' 
          ? new Date(data.date) 
          : new Date();

      if (isNaN(dateValue.getTime())) {
        console.error("[EDIT-COMMANDE] ❌ Date invalide");
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "La date est invalide",
        });
        return;
      }

      const updateData = {
        id: commandeId,
        reference: data.reference.trim(),
        date: dateValue,
        status: data.status || "DRAFT",
        produitId: data.produitId,
        quantite: Number(data.quantite),
        depotId: data.depotId && data.depotId !== "" ? data.depotId : null,
        fournisseurId: data.fournisseurId && data.fournisseurId !== "" ? data.fournisseurId : null,
        unitPrice: data.unitPrice ? Number(data.unitPrice) : null,
        devise: data.devise || "USD",
      };

     
      const result = await executeUpdate(updateData);
    
      if (result?.data?.success) {
        
        toast({ 
          title: "Succès", 
          description: "Commande modifiée avec succès !" 
        });
        setTimeout(() => {
          router.push(`/dashboard/commande`);
        }, 500);
      } else {
        const errorMsg = result?.data?.failure || result?.serverError || "Une erreur est survenue lors de la mise à jour.";
        console.error("[EDIT-COMMANDE] ❌ Erreur détectée:", errorMsg);
        console.error("[EDIT-COMMANDE] Résultat complet:", JSON.stringify(result, null, 2));
        toast({
          variant: "destructive",
          title: "Erreur",
          description: errorMsg,
        });
      }
    } catch (e: unknown) {
      console.error("[EDIT-COMMANDE] ❌ Exception capturée:", e);
      console.error("[EDIT-COMMANDE] Stack:", e instanceof Error ? e.stack : "N/A");
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de la mise à jour: " + (e instanceof Error ? e.message : "Erreur inconnue"),
      });
    } finally {
    }
  };

  // Handler pour afficher les erreurs de validation
  const onError = (errors: any) => {
    console.error("[EDIT-COMMANDE] Erreurs de validation du formulaire:", errors);
    const errorMessages: string[] = [];
    
    Object.keys(errors).forEach((key) => {
      const error = errors[key];
      if (error?.message) {
        errorMessages.push(`${key}: ${error.message}`);
      }
    });
    
    const errorMessage = errorMessages.length > 0 
      ? errorMessages.join(", ")
      : "Veuillez corriger les erreurs dans le formulaire";
    
    console.error("[EDIT-COMMANDE] Messages d'erreur:", errorMessage);
    
    toast({
      variant: "destructive",
      title: "Erreur de validation",
      description: errorMessage,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-2 text-gray-500">
          Chargement des informations de la commande...
        </p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">{errorMessage}</p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/dashboard/commande`)}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/commande")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Modifier la Commande</h1>
              <p className="text-muted-foreground">Mettre à jour les informations de la commande</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informations Générales
            </CardTitle>
            <CardDescription>Référence, date et statut de la commande</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reference">
                  Référence <span className="text-red-500">*</span>
                </Label>
                <Input id="reference" placeholder="Référence de la commande" {...register("reference")} />
                {errors.reference && (
                  <p className="text-red-500 text-sm">{errors.reference.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="date" 
                  type="date" 
                  defaultValue={formatDateForInput(watch("date"))}
                  onChange={(e) => {
                    const dateValue = e.target.value ? new Date(e.target.value) : new Date();
                    setValue("date", dateValue);
                  }}
                />
                {errors.date && (
                  <p className="text-red-500 text-sm">{errors.date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Statut <span className="text-red-500">*</span></Label>
                <Select
                  value={selectedValues.status}
                  onValueChange={(value: string) => {
                    const statusValue = value as "DRAFT" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "PARTIALLY_RECEIVED";
                    setValue("status", statusValue);
                    setSelectedValues(prev => ({ ...prev, status: statusValue }));
                  }}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Brouillon</SelectItem>
                    <SelectItem value="CONFIRMED">Confirmé</SelectItem>
                    <SelectItem value="PARTIALLY_RECEIVED">Partiellement reçu</SelectItem>
                    <SelectItem value="COMPLETED">Terminé</SelectItem>
                    <SelectItem value="CANCELLED">Annulé</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Relations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Relations
            </CardTitle>
            <CardDescription>Produit, dépôt et fournisseur associés</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="produitId" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Produit <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedValues.produitId}
                  onValueChange={(value: string) => {
                    setValue("produitId", value);
                    setSelectedValues(prev => ({ ...prev, produitId: value }));
                  }}
                  disabled={loadingData}
                >
                  <SelectTrigger id="produitId">
                    <SelectValue placeholder={loadingData ? "Chargement..." : "Sélectionner un produit"} />
                  </SelectTrigger>
                  <SelectContent>
                    {produits.map((produit) => (
                      <SelectItem key={produit.id} value={produit.id}>
                        {produit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.produitId && (
                  <p className="text-red-500 text-sm">{errors.produitId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="depotId" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Dépôt
                </Label>
                <Select
                  value={selectedValues.depotId}
                  onValueChange={(value: string) => {
                    setValue("depotId", value);
                    setSelectedValues(prev => ({ ...prev, depotId: value }));
                  }}
                  disabled={loadingData}
                >
                  <SelectTrigger id="depotId">
                    <SelectValue placeholder={loadingData ? "Chargement..." : "Sélectionner un dépôt (optionnel)"} />
                  </SelectTrigger>
                  <SelectContent>
                    {depots.map((depot) => (
                      <SelectItem key={depot.id} value={depot.id}>
                        {depot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.depotId && (
                  <p className="text-red-500 text-sm">{errors.depotId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fournisseurId" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Fournisseur
                </Label>
                <Select
                  value={selectedValues.fournisseurId}
                  onValueChange={(value: string) => {
                    setValue("fournisseurId", value);
                    setSelectedValues(prev => ({ ...prev, fournisseurId: value }));
                  }}
                  disabled={loadingData}
                >
                  <SelectTrigger id="fournisseurId">
                    <SelectValue placeholder={loadingData ? "Chargement..." : "Sélectionner un fournisseur (optionnel)"} />
                  </SelectTrigger>
                  <SelectContent>
                    {fournisseurs.map((fournisseur) => (
                      <SelectItem key={fournisseur.id} value={fournisseur.id}>
                        {fournisseur.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.fournisseurId && (
                  <p className="text-red-500 text-sm">{errors.fournisseurId.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quantité et Prix */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Quantité et Prix
            </CardTitle>
            <CardDescription>Quantité, prix unitaire et total</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantite" className="flex items-center gap-2">
                  Quantité <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="quantite" 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  {...register("quantite", { valueAsNumber: true })} 
                />
                {errors.quantite && (
                  <p className="text-red-500 text-sm">{errors.quantite?.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitPrice" className="flex items-center gap-2">
                  Prix Unitaire <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="unitPrice" 
                  type="number" 
                  step="0.0001"
                  placeholder="0.0000" 
                  {...register("unitPrice", { valueAsNumber: true })} 
                />
                {errors.unitPrice && (
                  <p className="text-red-500 text-sm">{errors.unitPrice.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="devise" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Devise
                </Label>
                <Select
                  value={selectedValues.devise}
                  onValueChange={(value: string) => {
                    const deviseValue = value as "XOF" | "USD" | "EUR" | "CDF";
                    setValue("devise", deviseValue);
                    setSelectedValues(prev => ({ ...prev, devise: deviseValue }));
                  }}
                >
                  <SelectTrigger id="devise">
                    <SelectValue placeholder="Sélectionner une devise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XOF">XOF</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="CDF">CDF</SelectItem>
                  </SelectContent>
                </Select>
                {errors.devise && <p className="text-red-500 text-sm">{errors.devise.message}</p>}
              </div>
            </div>

            {/* Calcul du total */}
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  <Label className="text-lg font-semibold">Total</Label>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {totalPrice} {watchedDevise || "USD"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {watchedQuantite || 0} × {watchedUnitPrice || 0}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push("/dashboard/commande")}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || loadingData || isLoading}
            onClick={(e) => {
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mise à jour...
              </>
            ) : (
              "Mettre à jour la commande"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}