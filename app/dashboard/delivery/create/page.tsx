"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateDeliverySchema } from "@/models/mvc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAction } from "next-safe-action/hooks";
import { usePathname, useRouter } from "next/navigation";
import { createAction } from "../actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, FileText, ImageIcon, File } from "lucide-react";

// Import des actions pour récupérer les données
import { getClients } from "@/app/dashboard/clients/actions";
import { listDepots } from "@/app/dashboard/depots/actions";
import { findAllAction as findAllEquipment } from "@/app/dashboard/equipment/actions";
import { listProducts } from "@/app/dashboard/products/actions";

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  type: string;
}

export default function CreateDeliveryPage() {
  type ClientRef = { id: string; nom?: string };
  type DepotRef = { id: string; name?: string };
  type EquipmentRef = {
    id: string;
    name?: string;
    produitId?: string | null;
    depotId?: string | null;
    depot?: { id: string; name?: string } | null;
  };
  type ProduitRef = { id: string; nom?: string };

  const [clients, setClients] = useState<ClientRef[]>([]);
  const [depots, setDepots] = useState<DepotRef[]>([]);
  const [equipment, setEquipment] = useState<EquipmentRef[]>([]);
  const [produits, setProduits] = useState<ProduitRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isDeliveryLBB = pathname.startsWith("/dashboard/delivery-lbb");
  const basePath = isDeliveryLBB ? "/dashboard/delivery-lbb" : "/dashboard/delivery";
  const depotParamRef = useRef<string | undefined>(
    searchParams.get("depot")?.toLowerCase() ?? (isDeliveryLBB ? "lubumbashi" : undefined)
  );

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(CreateDeliverySchema),
    defaultValues: {
      reference: "",
      deliveryDate: new Date(),
      note: "",
      clientId: "",
      depotId: "",
      equipmentId: "",
      produitId: "",
      quantity: 0,
      unit: "L",
      openingEter: null,
      closingEter: null,
      timeStart: "",
      timeEnd: "",
      prixUnitaire: null,
      paiement: "DIRECT",
      typeAircraft: "",
      flightNumber: "",
      linkDoc: "",
    }
  });

  // Hooks pour les actions de récupération
  const { executeAsync: executeDepots } = useAction(listDepots);
  const { executeAsync: executeEquipment } = useAction(findAllEquipment);
  const { executeAsync: executeProduits } = useAction(listProducts);
  

  const { toast } = useToast();

  // Charger les données de référence
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Charger les clients
        const clientsResult = await getClients();
        if (!isMounted) return;
        const mappedClients = (clientsResult || []).map((c: any) => ({
          id: c.id,
          nom: c.nom ?? c.name ?? c.company ?? "Sans nom",
        }));
        setClients(mappedClients);

        // Charger les dépôts - filtrage selon le contexte
        const depotsResult = await executeDepots();
        if (!isMounted) return;
        const depotsData = depotsResult?.data?.data ?? [];
        const scopedDepots = depotParamRef.current
          ? depotsData.filter((depot: DepotRef) =>
              depot.name?.toLowerCase().includes(depotParamRef.current as string)
            )
          : depotsData.filter((depot: DepotRef) =>
              depot.name?.toLowerCase().includes("kalemie")
            );
        setDepots(scopedDepots || []);

        // Pré-sélectionner le dépôt de contexte si trouvé
        if (scopedDepots.length > 0) {
          setValue("depotId", scopedDepots[0].id);
        }

        // Charger les équipements
        const equipmentResult = await executeEquipment();
        if (!isMounted) return;
        const equipmentData = equipmentResult?.data?.success ? equipmentResult.data.result : [];
        setEquipment(equipmentData || []);

        // Charger les produits
        const produitsResult = await executeProduits();
        if (!isMounted) return;
        const produitsData = produitsResult?.data?.data ?? [];
        setProduits(produitsData || []);
      } catch (error) {
        if (!isMounted) return;
        console.error("Erreur lors du chargement des données:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les données"
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
    // Les dépendances useAction/useSearchParams peuvent être instables et provoquer
    // des relances en boucle sur cette page; on charge uniquement au montage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Charger une seule fois au montage

  const equipmentId = watch("equipmentId");
  const depotId = watch("depotId");
  const openingEter = watch("openingEter");
  const closingEter = watch("closingEter");

  // Filtrer les equipment selon le dépôt sélectionné
  const filteredEquipment = depotId
    ? equipment.filter((eq) => (eq.depotId ?? eq.depot?.id) === depotId)
    : equipment;

  const allowedProduitIds = new Set(
    filteredEquipment
      .map((eq) => eq.produitId)
      .filter((id): id is string => Boolean(id))
  );
  const filteredProduits = depotId && allowedProduitIds.size > 0
    ? produits.filter((produit) => allowedProduitIds.has(produit.id))
    : produits;

  // Récupérer le produit automatiquement selon l'équipement
  useEffect(() => {
    if (equipmentId) {
      const eq = equipment.find(e => e.id === equipmentId);
      if (eq && eq.produitId) {
        setValue("produitId", eq.produitId);
      }
    }
  }, [equipmentId, equipment, setValue]);

  // Garantir la cohérence des champs si le dépôt courant change
  useEffect(() => {
    if (!depotId) return;

    if (equipmentId && !filteredEquipment.some((eq) => eq.id === equipmentId)) {
      setValue("equipmentId", "");
    }

    const currentProduitId = watch("produitId");
    if (currentProduitId && allowedProduitIds.size > 0 && !allowedProduitIds.has(currentProduitId)) {
      setValue("produitId", "");
    }
  }, [allowedProduitIds, depotId, equipmentId, filteredEquipment, setValue, watch]);

  // Calculer automatiquement la quantité à partir des compteurs
  useEffect(() => {
    if (openingEter !== null && closingEter !== null && openingEter !== undefined && closingEter !== undefined) {
      const difference = closingEter - openingEter;
      if (difference > 0) {
        setValue("quantity", difference, { shouldValidate: false });
      }
    }
  }, [openingEter, closingEter, setValue]);

  const router = useRouter();
  const { executeAsync, isExecuting: isPending } = useAction(createAction);

  // Fonction pour gérer l'upload de fichiers (placeholder: désactivé)
  const handleFileUpload = async (_files: FileList | null) => {
    toast({ title: "Info", description: "Upload désactivé pour l'instant. Utilisez le champ lien si besoin." });
  };

  // Fonction pour supprimer un fichier
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Fonction pour obtenir l'icône selon le type de fichier
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type.startsWith('text/') || type.includes('pdf')) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  // Fonction pour formater la taille du fichier
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const onSubmit = async (data: unknown) => {
    try {
      const result = await (executeAsync as (data: unknown) => Promise<{ data?: { success?: boolean; failure?: string } }>)(data);
      if (!result?.data?.success) {
        throw new Error(result?.data?.failure || "Erreur inconnue lors de l'enregistrement.");
      }
      toast({ title: "Succès", description: "Livraison ajoutée avec succès !" });
      router.push(basePath);
    } catch (e: unknown) {
      console.error("Erreur lors de la soumission du formulaire:", e);
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: e instanceof Error ? e.message : "Une erreur est survenue lors de l'enregistrement." 
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Chargement des données...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Nouvelle Livraison Aviation</h1>
        <Button variant="outline" onClick={() => router.back()}>Retour</Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations Générales</CardTitle>
            <CardDescription>Référence, date et note de livraison</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="reference">Référence</Label>
                <Input 
                  id="reference" 
                  {...register("reference")} 
                  placeholder="Référence de la livraison (optionnel)" 
                />
                {errors.reference && <p className="text-red-500 text-sm">{errors.reference.message as string}</p>}
              </div>
              <div>
                <Label htmlFor="deliveryDate">Date de livraison <span className="text-red-500">*</span></Label>
                <Input 
                  id="deliveryDate" 
                  type="date" 
                  {...register("deliveryDate", { valueAsDate: true })} 
                />
                {errors.deliveryDate && <p className="text-red-500 text-sm">{errors.deliveryDate.message as string}</p>}
              </div>
              <div>
                <Label htmlFor="note">Note</Label>
                <Input 
                  id="note" 
                  {...register("note")} 
                  placeholder="Note de livraison (optionnel)" 
                />
                {errors.note && <p className="text-red-500 text-sm">{errors.note.message as string}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sélection des entités */}
        <Card>
          <CardHeader>
            <CardTitle>Relations</CardTitle>
            <CardDescription>Client, dépôt, Equipment et produit associés</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientId">Client</Label>
                <Select onValueChange={(value) => setValue("clientId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.clientId && <p className="text-red-500 text-sm">{errors.clientId.message as string}</p>}
              </div>

              <div>
                <Label htmlFor="depotId">Dépôt</Label>
                <Select 
                  onValueChange={(value) => {
                    setValue("depotId", value);
                    // Réinitialiser le Equipment si le dépôt change
                    setValue("equipmentId", "");
                  }}
                  value={watch("depotId") || undefined}
                  disabled={depots.length === 1}
                >
                  <SelectTrigger className={depots.length === 1 ? "bg-muted" : ""}>
                    <SelectValue 
                      placeholder={
                        depots.length === 1 
                          ? depots[0]?.name || "Kalemie" 
                          : "Sélectionner un dépôt (optionnel)"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {depots.map((depot) => (
                      <SelectItem key={depot.id} value={depot.id}>
                        {depot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.depotId && <p className="text-red-500 text-sm">{errors.depotId.message as string}</p>}
                {depots.length === 1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Dépôt pré-sélectionné selon le module
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="equipmentId">Equipment</Label>
                <Select 
                  onValueChange={(value) => setValue("equipmentId", value)}
                  disabled={!depotId && depots.length > 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={depotId ? "Sélectionner un Equipment (optionnel)" : "Sélectionnez d'abord un dépôt"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredEquipment.map((eq) => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.equipmentId && <p className="text-red-500 text-sm">{errors.equipmentId.message as string}</p>}
                {equipmentId && equipment.find(t => t.id === equipmentId)?.produitId && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Produit associé au Equipment sélectionné automatiquement
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="produitId">Produit</Label>
                <Select 
                  onValueChange={(value) => setValue("produitId", value)}
                  value={watch("produitId") || undefined}
                  disabled={equipmentId && equipment.find(t => t.id === equipmentId)?.produitId ? true : false}
                >
                  <SelectTrigger className={equipmentId && equipment.find(t => t.id === equipmentId)?.produitId ? "bg-muted" : ""}>
                    <SelectValue 
                      placeholder={
                        equipmentId && equipment.find(t => t.id === equipmentId)?.produitId 
                          ? "Sélectionné automatiquement selon le Equipment" 
                          : "Sélectionner un produit (optionnel)"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProduits.length === 0 ? (
                      <SelectItem value="__no_product_available__" disabled>Aucun produit disponible</SelectItem>
                    ) : (
                      filteredProduits.map((produit) => (
                        <SelectItem key={produit.id} value={produit.id}>
                          {produit.nom || "Produit sans nom"}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.produitId && <p className="text-red-500 text-sm">{errors.produitId.message as string}</p>}
                {equipmentId && equipment.find(t => t.id === equipmentId)?.produitId && (
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    ✓ Produit automatiquement sélectionné selon le Equipment
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quantité et unité */}
        <Card>
          <CardHeader>
            <CardTitle>Quantité et Unité</CardTitle>
            <CardDescription>Quantité livrée et unité de mesure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantité <span className="text-red-500">*</span></Label>
                <Input 
                  id="quantity" 
                  type="number"
                  step="0.0001"
                  {...register("quantity", { valueAsNumber: true })} 
                  placeholder="Ex: 1.2345"
                  readOnly={openingEter !== null && closingEter !== null && openingEter !== undefined && closingEter !== undefined}
                  className={openingEter !== null && closingEter !== null && openingEter !== undefined && closingEter !== undefined ? "bg-muted" : ""}
                />
                {openingEter !== null && closingEter !== null && openingEter !== undefined && closingEter !== undefined && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Calculé automatiquement à partir des compteurs
                  </p>
                )}
                {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity.message as string}</p>}
              </div>
              <div>
                <Label htmlFor="unit">Unité <span className="text-red-500">*</span></Label>
                <Select 
                  onValueChange={(value) => setValue("unit", value)} 
                  value={watch("unit") || "L"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une unité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Litre (L)</SelectItem>
                    <SelectItem value="M3">Mètre cube (M³)</SelectItem>
                    <SelectItem value="KG">Kilogramme (KG)</SelectItem>
                    <SelectItem value="G">Gramme (G)</SelectItem>
                    <SelectItem value="TONNE">Tonne</SelectItem>
                  </SelectContent>
                </Select>
                {errors.unit && <p className="text-red-500 text-sm">{errors.unit.message as string}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mesures */}
        <Card>
          <CardHeader>
            <CardTitle>Compteurs et Horaires</CardTitle>
            <CardDescription>Compteurs d&apos;ouverture/fermeture et horaires de livraison</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="openingEter">Compteur d&apos;ouverture</Label>
                <Input 
                  id="openingEter" 
                  type="number" 
                  step="0.01"
                  {...register("openingEter", { valueAsNumber: true })} 
                  placeholder="Ex: 1000" 
                />
                {errors.openingEter && <p className="text-red-500 text-sm">{errors.openingEter.message as string}</p>}
              </div>

              <div>
                <Label htmlFor="closingEter">Compteur de fermeture</Label>
                <Input 
                  id="closingEter" 
                  type="number" 
                  step="0.01"
                  {...register("closingEter", { valueAsNumber: true })} 
                  placeholder="Ex: 1200" 
                />
                {errors.closingEter && <p className="text-red-500 text-sm">{errors.closingEter.message as string}</p>}
                {openingEter !== null && closingEter !== null && openingEter !== undefined && closingEter !== undefined && (
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    Différence: {(closingEter - openingEter).toFixed(2)}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="timeStart">Heure de début</Label>
                <Input 
                  id="timeStart" 
                  type="time" 
                  {...register("timeStart")} 
                />
                {errors.timeStart && <p className="text-red-500 text-sm">{errors.timeStart.message as string}</p>}
              </div>

              <div>
                <Label htmlFor="timeEnd">Heure de fin</Label>
                <Input 
                  id="timeEnd" 
                  type="time" 
                  {...register("timeEnd")} 
                />
                {errors.timeEnd && <p className="text-red-500 text-sm">{errors.timeEnd.message as string}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paiement et détails */}
        <Card>
          <CardHeader>
            <CardTitle>Paiement et Prix</CardTitle>
            <CardDescription>Prix unitaire et type de paiement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prixUnitaire">Prix unitaire (USD)</Label>
                <Input 
                  id="prixUnitaire" 
                  type="number" 
                  step="0.0001" 
                  {...register("prixUnitaire", { valueAsNumber: true })} 
                  placeholder="Ex: 1.0949"
                />
                {errors.prixUnitaire && <p className="text-red-500 text-sm">{errors.prixUnitaire.message as string}</p>}
              </div>

              <div>
                <Label htmlFor="paiement">Type de paiement</Label>
                <Select onValueChange={(value) => setValue("paiement", value as "DIRECT" | "CREDIT")} defaultValue="DIRECT">
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type de paiement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DIRECT">Direct</SelectItem>
                    <SelectItem value="CREDIT">Crédit</SelectItem>
                  </SelectContent>
                </Select>
                {errors.paiement && <p className="text-red-500 text-sm">{errors.paiement.message as string}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations aviation */}
        <Card>
          <CardHeader>
            <CardTitle>Informations Aviation</CardTitle>
            <CardDescription>Type d&apos;avion et numéro de vol</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="typeAircraft">Type d&apos;avion</Label>
                <Input 
                  id="typeAircraft" 
                  {...register("typeAircraft")} 
                  placeholder="Ex: Boeing 737, Airbus A320"
                />
                {errors.typeAircraft && <p className="text-red-500 text-sm">{errors.typeAircraft.message as string}</p>}
              </div>

              <div>
                <Label htmlFor="flightNumber">Numéro de vol</Label>
                <Input 
                  id="flightNumber" 
                  {...register("flightNumber")} 
                  placeholder="Ex: AF1234, SN456"
                />
                {errors.flightNumber && <p className="text-red-500 text-sm">{errors.flightNumber.message as string}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload de fichiers */}
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Upload de fichiers liés à la livraison</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Zone d'upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <div className="flex flex-col items-center space-y-2">
                <Upload className="h-8 w-8 text-gray-400" />
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? "Upload en cours..." : "Sélectionner des fichiers"}
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  PDF, DOC, DOCX, JPG, PNG, TXT (max 10MB par fichier)
                </p>
              </div>
            </div>

            {/* Liste des fichiers uploadés */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Fichiers uploadés</Label>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.type)}
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(file.url, '_blank')}
                        >
                          Voir
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Champ linkDoc caché */}
            <input type="hidden" {...register("linkDoc")} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isPending || uploading} className="px-8">
            {isPending ? "Enregistrement..." : "Enregistrer la livraison"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push(basePath)}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
