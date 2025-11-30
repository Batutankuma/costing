"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateDeliverySchema } from "@/models/mvc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { createAction } from "../actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, FileText, ImageIcon, File } from "lucide-react";

// Import des actions pour récupérer les données
import { getClients } from "@/app/dashboard/clients/actions";
import { listDepots } from "@/app/dashboard/depots/actions";
import { findAllAction as findAllTanks } from "@/app/dashboard/tank/actions";
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
  type TankRef = { id: string; name?: string; produitId?: string | null };
  type ProduitRef = { id: string; nom?: string };

  const [clients, setClients] = useState<ClientRef[]>([]);
  const [depots, setDepots] = useState<DepotRef[]>([]);
  const [tanks, setTanks] = useState<TankRef[]>([]);
  const [produits, setProduits] = useState<ProduitRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks pour les actions de récupération
  const { executeAsync: executeDepots } = useAction(listDepots);
  const { executeAsync: executeTanks } = useAction(findAllTanks);
  const { executeAsync: executeProduits } = useAction(listProducts);
  

  const { toast } = useToast();

  // Charger les données de référence
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Charger les clients
        const clientsResult = await getClients();
        setClients((clientsResult as any[]) || []);

        // Charger les dépôts
        const depotsResult = await executeDepots();
        const depotsData = (depotsResult as any)?.data ?? (depotsResult as any)?.result ?? [];
        setDepots(depotsData || []);

        // Charger les tanks
        const tanksResult = await executeTanks();
        const tanksData = (tanksResult as any)?.data ?? (tanksResult as any)?.result ?? [];
        setTanks(tanksData || []);

        // Charger les produits
        const produitsResult = await executeProduits();
        const produitsData = (produitsResult as any)?.data ?? (produitsResult as any)?.result ?? [];
        setProduits(produitsData || []);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les données"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [executeDepots, executeTanks, executeProduits, toast]);

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    setValue,
    watch
  } = useForm({
    resolver: zodResolver(CreateDeliverySchema),
    defaultValues: {
      deliveryDate: new Date(),
      note: "",
      clientId: "",
      depotId: "",
      tankId: "",
      produitId: "",
      quantity: 0,
      unit: "L",
      openingEter: 0,
      closingEter: 0,
      timeStart: "",
      timeEnd: "",
      prixUnitaire: 0,
      paiement: "DIRECT",
      typeAircraft: "",
      flightNumber: "",
      linkDoc: "",
    }
  });

  const tankId = watch("tankId");

  // Récupérer le produit automatiquement selon le tank
  useEffect(() => {
    if (tankId) {
      const tank = tanks.find(t => t.id === tankId);
      if (tank && tank.produitId) {
        setValue("produitId", tank.produitId);
      }
    }
  }, [tankId, tanks, setValue]);

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
      router.push('/dashboard/delivery');
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
            <CardDescription>Date, quantité, unité et note</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deliveryDate">Date <span className="text-red-500">*</span></Label>
                <Input 
                  id="deliveryDate" 
                  type="date" 
                  {...register("deliveryDate", { valueAsDate: true })} 
                />
                {errors.deliveryDate && <p className="text-red-500 text-sm">{errors.deliveryDate.message as string}</p>}
              </div>
              <div>
                <Label htmlFor="note">Note <span className="text-red-500">*</span></Label>
                <Input 
                  id="note" 
                  {...register("note")} 
                  placeholder="Numéro de note de livraison" 
                />
                {errors.note && <p className="text-red-500 text-sm">{errors.note.message as string}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantité <span className="text-red-500">*</span></Label>
                <Input 
                  id="quantity" 
                  type="number"
                  step="0.0001"
                  {...register("quantity", { valueAsNumber: true })} 
                  placeholder="Ex: 1.2345" 
                />
                {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity.message as string}</p>}
              </div>
              <div>
                <Label htmlFor="unit">Unité <span className="text-red-500">*</span></Label>
                <Input 
                  id="unit" 
                  {...register("unit")} 
                  placeholder="Ex: L, M3" 
                />
                {errors.unit && <p className="text-red-500 text-sm">{errors.unit.message as string}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sélection des entités */}
        <Card>
          <CardHeader>
            <CardTitle>Sélection</CardTitle>
            <CardDescription>Client, dépôt, tank et produit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientId">Client <span className="text-red-500">*</span></Label>
                <Select onValueChange={(value) => setValue("clientId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
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
                <Label htmlFor="depotId">Dépôt <span className="text-red-500">*</span></Label>
                <Select onValueChange={(value) => setValue("depotId", value)}>
                  <SelectTrigger>
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
                {errors.depotId && <p className="text-red-500 text-sm">{errors.depotId.message as string}</p>}
              </div>

              <div>
                <Label htmlFor="tankId">Tank <span className="text-red-500">*</span></Label>
                <Select onValueChange={(value) => setValue("tankId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un tank" />
                  </SelectTrigger>
                  <SelectContent>
                    {tanks.map((tank) => (
                      <SelectItem key={tank.id} value={tank.id}>
                        {tank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.tankId && <p className="text-red-500 text-sm">{errors.tankId.message as string}</p>}
              </div>

              <div>
                <Label htmlFor="produitId">Produit <span className="text-red-500">*</span></Label>
                <Select onValueChange={(value) => setValue("produitId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {produits.map((produit) => (
                      <SelectItem key={produit.id} value={produit.id}>
                        {produit.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.produitId && <p className="text-red-500 text-sm">{errors.produitId.message as string}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mesures */}
        <Card>
          <CardHeader>
            <CardTitle>Mesures</CardTitle>
            <CardDescription>Compteurs et horaires</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="openingEter">Compteur d&apos;ouverture <span className="text-red-500">*</span></Label>
                <Input 
                  id="openingEter" 
                  type="number" 
                  {...register("openingEter", { valueAsNumber: true })} 
                  placeholder="Ex: 1000" 
                />
                {errors.openingEter && <p className="text-red-500 text-sm">{errors.openingEter.message as string}</p>}
              </div>

              <div>
                <Label htmlFor="closingEter">Compteur de fermeture <span className="text-red-500">*</span></Label>
                <Input 
                  id="closingEter" 
                  type="number" 
                  {...register("closingEter", { valueAsNumber: true })} 
                  placeholder="Ex: 1200" 
                />
                {errors.closingEter && <p className="text-red-500 text-sm">{errors.closingEter.message as string}</p>}
              </div>

              <div>
                <Label htmlFor="timeStart">Heure de début <span className="text-red-500">*</span></Label>
                <Input 
                  id="timeStart" 
                  type="time" 
                  {...register("timeStart")} 
                />
                {errors.timeStart && <p className="text-red-500 text-sm">{errors.timeStart.message as string}</p>}
              </div>

              <div>
                <Label htmlFor="timeEnd">Heure de fin <span className="text-red-500">*</span></Label>
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
            <CardTitle>Paiement et Détails</CardTitle>
            <CardDescription>Prix, type de paiement et informations aviation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prixUnitaire">Prix unitaire <span className="text-red-500">*</span></Label>
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
                <Label htmlFor="paiement">Type de paiement <span className="text-red-500">*</span></Label>
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

              <div>
                <Label htmlFor="typeAircraft">Type d&apos;avion <span className="text-red-500">*</span></Label>
                <Input 
                  id="typeAircraft" 
                  {...register("typeAircraft")} 
                  placeholder="Ex: Boeing 737"
                />
                {errors.typeAircraft && <p className="text-red-500 text-sm">{errors.typeAircraft.message as string}</p>}
              </div>

              <div>
                <Label htmlFor="flightNumber">Numéro de vol <span className="text-red-500">*</span></Label>
                <Input 
                  id="flightNumber" 
                  {...register("flightNumber")} 
                  placeholder="Ex: AF1234"
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
          <Button type="button" variant="outline" onClick={() => router.push('/dashboard/delivery')}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
