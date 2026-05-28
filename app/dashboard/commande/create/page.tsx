"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { createAction } from "../actions";
// import { CreateCommandeSchema } from "@/models/mvc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useMemo } from "react";
import { Loader2, Calculator, Package, Building2, CreditCard, DollarSign, FileText, AlertCircle } from "lucide-react";

// Import des actions pour récupérer les données
import { listProducts } from "@/app/dashboard/products/actions";
import { findAllAction as findAllFournisseurs } from "@/app/dashboard/crm/fournisseur/actions";
import { listDepots } from "@/app/dashboard/depots/actions";
import { TYPE_FACTURE_OPTIONS } from "@/models/mvc";
import { commandeDecimalRefine, COMMANDE_DECIMAL_PLACES } from "@/lib/commande-decimals";

export default function CreateCommandePage() {
  type ProduitRef = { id: string; name: string };
  type FournisseurRef = { id: string; nom: string };
  type DepotRef = { id: string; name: string };
  const [produits, setProduits] = useState<ProduitRef[]>([]);
  const [fournisseurs, setFournisseurs] = useState<FournisseurRef[]>([]);
  const [depots, setDepots] = useState<DepotRef[]>([]);
  const [loading, setLoading] = useState(true);
  // Utiliser isSubmitting depuis react-hook-form au lieu d'un état local

  // Hooks pour les actions de récupération
  const { executeAsync: executeProduits } = useAction(listProducts);
  const { executeAsync: executeFournisseurs } = useAction(findAllFournisseurs);
  const { executeAsync: executeDepots } = useAction(listDepots);
  const { executeAsync: executeCreate } = useAction(createAction);

  const { toast } = useToast();
  const router = useRouter();

  // Chargement des données de référence (via actions uniquement)
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [produitsResult, fournisseursResult, depotsResult] = await Promise.all([
          executeProduits(),
          executeFournisseurs(),
          executeDepots(),
        ]);
        if (produitsResult?.data?.data) setProduits(produitsResult.data.data || []);
        if (fournisseursResult?.data?.success) setFournisseurs(fournisseursResult.data.result || []);
        if (depotsResult?.data?.data) setDepots(depotsResult.data.data || []);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [executeProduits, executeFournisseurs, executeDepots]);

  // Schéma de validation côté client (sans contraintes UUID strictes)
  const ClientCommandeSchema = z.object({
    reference: z.string().min(1, "La référence est requise"),
    status: z.enum(["DRAFT", "CONFIRMED", "PARTIALLY_RECEIVED", "COMPLETED", "CANCELLED"]),
    produitId: z.string().min(1, "Veuillez sélectionner un produit"),
    depotId: z.string().min(1, "Veuillez sélectionner un dépôt"),
    fournisseurId: z.string().min(1, "Veuillez sélectionner un fournisseur"),
    quantity: z
      .number()
      .min(0.0001, "La quantité doit être supérieure à 0")
      .refine(commandeDecimalRefine.check, { message: commandeDecimalRefine.message }),
    unitPrice: z
      .number()
      .min(0.0001, "Le prix unitaire doit être supérieur à 0")
      .refine(commandeDecimalRefine.check, { message: commandeDecimalRefine.message }),
    devise: z.enum(["XOF", "USD", "EUR", "CDF"]),
    typePaiement: z.enum(["DIRECT", "CREDIT"]),
    // Champs facture
    numeroFacture: z.string().optional(),
    typeFacture: z.enum(TYPE_FACTURE_OPTIONS).optional(),
    dateFacture: z.date().optional().nullable(),
    tva: z
      .number()
      .optional()
      .nullable()
      .refine((v) => v == null || commandeDecimalRefine.check(v), { message: commandeDecimalRefine.message }),
  });

  type CommandeForm = z.infer<typeof ClientCommandeSchema>;

    // Configuration du formulaire
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    watch,
  } = useForm<CommandeForm>({
    resolver: zodResolver(ClientCommandeSchema),
    defaultValues: {
      status: "DRAFT",
      reference: "",
      produitId: "",
      depotId: "",
      devise: "USD",
      typePaiement: "DIRECT",
      fournisseurId: "",
      quantity: 0,
      unitPrice: 0,
      numeroFacture: "",
      typeFacture: undefined,
      dateFacture: undefined,
      tva: 0,
    }
  });



  // Watch pour les calculs en temps réel
  const watchedQuantity = watch("quantity");
  const watchedUnitPrice = watch("unitPrice");
  const watchedDevise = watch("devise");

  // Calcul du prix total
  const totalPrice = useMemo(() => {
    if (watchedQuantity && watchedUnitPrice) {
      return (watchedQuantity * watchedUnitPrice).toFixed(COMMANDE_DECIMAL_PLACES);
    }
    return "0.00";
  }, [watchedQuantity, watchedUnitPrice]);

  
  // Soumission du formulaire
  type CommandeFormData = {
    reference: string;
    status: "DRAFT" | "CONFIRMED" | "PARTIALLY_RECEIVED" | "COMPLETED" | "CANCELLED";
    produitId: string;
    depotId: string;
    fournisseurId: string;
    quantity: number;
    unitPrice: number;
    devise: "XOF" | "USD" | "EUR" | "CDF";
    typePaiement: "DIRECT" | "CREDIT";
    numeroFacture?: string;
    typeFacture?: z.infer<typeof ClientCommandeSchema>["typeFacture"];
    dateFacture?: Date | null;
    tva?: number | null;
  };

  const onSubmit = async (data: CommandeFormData) => {
    try {
  
      // Validation des données sélectionnées
      const selectedProduit = produits.find(p => p.id === data.produitId);
      const selectedDepot = depots.find(d => d.id === data.depotId);
      const selectedFournisseur = fournisseurs.find(f => f.id === data.fournisseurId);
   
      if (!selectedProduit || !selectedDepot || !selectedFournisseur) {
        console.warn("[CREATE-COMMANDE] Sélection invalide", { produitId: data.produitId, depotId: data.depotId, fournisseurId: data.fournisseurId });
        toast({
          variant: "destructive",
          title: "Erreur de validation",
          description: "Veuillez sélectionner un produit, un dépôt et un fournisseur valides"
        });
        return;
      }

      // Préparer les données pour l'envoi
      const commandeData = {
        reference: data.reference,
        status: data.status,
        produitId: data.produitId,
        depotId: data.depotId,
        fournisseurId: data.fournisseurId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        devise: data.devise,
        typePaiement: data.typePaiement,
        currentQuantity: 0,
        numeroFacture: data.numeroFacture || null,
        typeFacture: data.typeFacture ?? null,
        dateFacture: data.dateFacture || null,
        tva: data.tva ?? null,
      };

   
      // Envoyer au serveur
      const result = await executeCreate(commandeData);
    
      if (result?.data?.success) {
        toast({ title: "Succès", description: "Commande créée avec succès !" });
      router.push('/dashboard/commande');
      } else {
        const failure = result?.data?.failure || "Erreur lors de la création de la commande";
        console.error("[CREATE-COMMANDE] Erreur serveur:", failure);
        toast({ variant: "destructive", title: "Erreur serveur", description: failure });
      }

    } catch (error) {
      console.error("[CREATE-COMMANDE] Erreur lors de la soumission:", error);
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: error instanceof Error ? error.message : "Une erreur est survenue"
      });
    } finally {
    
    }
  };

  // Ne pas bloquer l'interface: on continue même si chargement ou listes vides

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle Commande</h1>
          <p className="text-gray-600 mt-1">Créer une nouvelle commande de produits</p>
        </div>
        <Badge variant="outline" className="text-sm w-fit">
          <FileText className="w-4 h-4 mr-2" />
          Formulaire de commande
        </Badge>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {loading && (
          <div className="p-3 rounded-md border border-yellow-200 bg-yellow-50 text-yellow-800 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Chargement des données de référence…</span>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Section Informations Générales */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Informations Générales
              </CardTitle>
              <CardDescription>
                Renseignez les informations de base de la commande
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reference" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Référence <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="reference"
                    placeholder="Ex: CMD-2024-001"
                    {...register("reference")}
                    className={errors.reference ? "border-red-500" : ""}
                  />
                  {errors.reference && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.reference?.message?.toString()}
                    </p>
                  )}
          </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="flex items-center gap-2">
                    <Badge className="w-4 h-4" />
                    Statut <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="status"
                    control={control}
                    defaultValue="DRAFT"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.status ? "border-red-500" : ""}>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                      <SelectItem value="DRAFT">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="w-2 h-2 rounded-full" />
                          Brouillon
                        </div>
                      </SelectItem>
                      <SelectItem value="CONFIRMED">
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="w-2 h-2 rounded-full" />
                          Confirmée
                        </div>
                      </SelectItem>
                      <SelectItem value="COMPLETED">
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="w-2 h-2 rounded-full bg-green-500" />
                          Terminée
                        </div>
                      </SelectItem>
                      <SelectItem value="CANCELLED">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="w-2 h-2 rounded-full" />
                          Annulée
                        </div>
                      </SelectItem>
              </SelectContent>
            </Select>
                    )}
                  />
                  {errors.status && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.status?.message?.toString()}
                    </p>
                  )}
                </div>
          </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="produitId" className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Produit <span className="text-red-500">*</span>
                  </Label>
            <Controller
              name="produitId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={loading || produits.length === 0}>
                    <SelectTrigger className={errors.produitId ? "border-red-500" : ""}>
                <SelectValue placeholder="Sélectionner un produit" />
              </SelectTrigger>
              <SelectContent>
                      {produits.map((produit: ProduitRef) => (
                  <SelectItem key={produit.id} value={produit.id}>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4" />
                    {produit.name}
                          </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
              )}
            />
                  {errors.produitId && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.produitId?.message?.toString()}
                    </p>
                  )}
                  {!watch("produitId") && (
                    <p className="text-amber-600 text-sm flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Veuillez sélectionner un produit
                    </p>
                  )}
          </div>

                <div className="space-y-2">
                  <Label htmlFor="fournisseurId" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Fournisseur <span className="text-red-500">*</span>
                  </Label>
            <Controller
              name="fournisseurId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={loading || fournisseurs.length === 0}>
                    <SelectTrigger className={errors.fournisseurId ? "border-red-500" : ""}>
                <SelectValue placeholder="Sélectionner un fournisseur" />
              </SelectTrigger>
              <SelectContent>
                      {fournisseurs.map((fournisseur: FournisseurRef) => (
                  <SelectItem key={fournisseur.id} value={fournisseur.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                    {fournisseur.nom}
                          </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
              )}
            />
                  {errors.fournisseurId && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.fournisseurId?.message?.toString()}
                    </p>
                  )}
                  {!watch("fournisseurId") && (
                    <p className="text-amber-600 text-sm flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Veuillez sélectionner un fournisseur
                    </p>
                  )}
                </div>
          </div>

              <div className="space-y-2">
                <Label htmlFor="depotId" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Dépôt de destination <span className="text-red-500">*</span>
                </Label>
            <Controller
              name="depotId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={loading || depots.length === 0}>
                  <SelectTrigger className={errors.depotId ? "border-red-500" : ""}>
                <SelectValue placeholder="Sélectionner un dépôt" />
              </SelectTrigger>
              <SelectContent>
                    {depots.map((depot: DepotRef) => (
                  <SelectItem key={depot.id} value={depot.id}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                    {depot.name}
                        </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
              )}
            />
                {errors.depotId && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.depotId?.message?.toString()}
                  </p>
                )}
                {!watch("depotId") && (
                  <p className="text-amber-600 text-sm flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Veuillez sélectionner un dépôt
                  </p>
                )}
          </div>
            </CardContent>
          </Card>

          {/* Section Calculs et Résumé */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Calculs
              </CardTitle>
              <CardDescription>
                Résumé financier de la commande
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="quantity" className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Quantité <span className="text-red-500">*</span>
                </Label>
            <Input 
              id="quantity" 
              type="number" 
              step="0.0001" 
                  placeholder="0.0000"
              {...register("quantity", { valueAsNumber: true })} 
                  className={errors.quantity ? "border-red-500" : ""}
                />
                {errors.quantity && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.quantity?.message?.toString()}
                  </p>
                )}
          </div>

              <div className="space-y-2">
                <Label htmlFor="unitPrice" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Prix unitaire <span className="text-red-500">*</span>
                </Label>
            <Input 
              id="unitPrice" 
              type="number" 
              step="0.0001" 
              min="0.0001"
                  placeholder="0.0000"
              {...register("unitPrice", { 
                valueAsNumber: true,
                setValueAs: (value) => {
                  const num = parseFloat(value);
                  return isNaN(num) ? 0 : num;
                }
              })} 
                  className={errors.unitPrice ? "border-red-500" : ""}
                />
                {errors.unitPrice && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.unitPrice?.message?.toString()}
                  </p>
                )}
              </div>

              <Separator />

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Prix total:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {totalPrice} {watchedDevise}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {watchedQuantity || 0} × {watchedUnitPrice || 0} = {totalPrice} {watchedDevise}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Paiement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Conditions de Paiement
            </CardTitle>
            <CardDescription>
              Définissez les modalités de paiement et la devise
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-2">
                <Label htmlFor="devise" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Devise <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="devise"
                  control={control}
                  defaultValue="USD"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={errors.devise ? "border-red-500" : ""}>
                    <SelectValue placeholder="Sélectionner une devise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XOF">XOF - Franc CFA</SelectItem>
                    <SelectItem value="USD">USD - Dollar US</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="CDF">CDF - Franc Congolais</SelectItem>
                  </SelectContent>
                </Select>
                  )}
                />
                {errors.devise && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.devise?.message?.toString()}
                  </p>
                )}
          </div>

              <div className="space-y-2">
                <Label htmlFor="typePaiement" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Type de paiement <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="typePaiement"
                  control={control}
                  defaultValue="DIRECT"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={errors.typePaiement ? "border-red-500" : ""}>
                <SelectValue placeholder="Sélectionner un type de paiement" />
              </SelectTrigger>
              <SelectContent>
                    <SelectItem value="DIRECT">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Paiement Direct
                      </div>
                    </SelectItem>
                    <SelectItem value="CREDIT">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Paiement à Crédit
                      </div>
                    </SelectItem>
              </SelectContent>
            </Select>
                  )}
                />
                {errors.typePaiement && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.typePaiement?.message?.toString()}
                  </p>
                )}
          </div>
        </div>
          </CardContent>
        </Card>

        {/* Section Facture */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Informations Facture
            </CardTitle>
            <CardDescription>
              Renseignez les informations de facturation (optionnel)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-2">
                <Label htmlFor="numeroFacture" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Numéro Facture
                </Label>
                <Input
                  id="numeroFacture"
                  placeholder="Ex: FACT-2024-001"
                  {...register("numeroFacture")}
                  className={errors.numeroFacture ? "border-red-500" : ""}
                />
                {errors.numeroFacture && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.numeroFacture?.message?.toString()}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="typeFacture" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Type de Facture
                </Label>
                <Controller
                  name="typeFacture"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || "none"}
                      onValueChange={(value) => field.onChange(value === "none" ? undefined : value)}
                    >
                      <SelectTrigger
                        id="typeFacture"
                        className={errors.typeFacture ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Sélectionner un type de facture" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Non renseigné —</SelectItem>
                        {TYPE_FACTURE_OPTIONS.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.typeFacture && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.typeFacture?.message?.toString()}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFacture" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Date Facture
                </Label>
                <Input
                  id="dateFacture"
                  type="date"
                  {...register("dateFacture", {
                    setValueAs: (value) => value ? new Date(value) : null
                  })}
                  className={errors.dateFacture ? "border-red-500" : ""}
                />
                {errors.dateFacture && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.dateFacture?.message?.toString()}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tva" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  TVA (%)
                </Label>
                <Input
                  id="tva"
                  type="number"
                  step="0.0001"
                  min="0"
                  placeholder="0.0000"
                  {...register("tva", { valueAsNumber: true })}
                  className={errors.tva ? "border-red-500" : ""}
                />
                {errors.tva && (
                  <p className="text-red-500 text-sm flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.tva?.message?.toString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/commande')}
            className="w-full sm:w-auto sm:min-w-[120px]"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || loading || produits.length === 0 || depots.length === 0 || fournisseurs.length === 0}
            className="w-full sm:w-auto sm:min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
