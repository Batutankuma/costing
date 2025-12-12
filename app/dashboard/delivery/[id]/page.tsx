"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

import { CreateDeliverySchema } from "@/models/mvc";
import { z } from "zod";

// Schema for editing delivery with required paiement
const EditDeliverySchema = CreateDeliverySchema.extend({
  id: z.string().uuid(),
  paiement: z.enum(["DIRECT", "CREDIT"]), // Make paiement required without default
});
import { findByIdAction, updateAction } from "../actions";
import { getClients } from "@/app/dashboard/clients/actions";
import { listDepots } from "@/app/dashboard/depots/actions";
import { findAllAction as findAllTanks } from "@/app/dashboard/tank/actions";
import { listProducts } from "@/app/dashboard/products/actions";

type Client = {
  id: string;
  nom?: string | null;
  name?: string | null;
  company?: string | null;
};

type Depot = {
  id: string;
  name: string;
};

type Tank = {
  id: string;
  name: string;
  produitId?: string | null;
};

type Produit = {
  id: string;
  nom: string;
};

export default function EditDeliveryPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  // Hooks pour les actions de récupération
  const { executeAsync: executeDepots } = useAction(listDepots);
  const { executeAsync: executeTanks } = useAction(findAllTanks);
  const { executeAsync: executeProduits } = useAction(listProducts);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof EditDeliverySchema>>({
    resolver: zodResolver(EditDeliverySchema),
    defaultValues: async () => ({
      id: "",
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
      paiement: "CREDIT",
      typeAircraft: "",
      flightNumber: "",
      linkDoc: "",
    }),
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

  // Charger les données de référence
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        
        // Charger les clients
        const clientsResult = await getClients();
        const mappedClients = (clientsResult || []).map((c: any) => ({
          id: c.id,
          nom: c.nom ?? c.name ?? c.company ?? "",
          name: c.name,
          company: c.company,
        }));
        setClients(mappedClients);

        // Charger les dépôts
        const depotsResult = await executeDepots();
        const depotsData = depotsResult?.data?.data ?? [];
        setDepots(depotsData || []);

        // Charger les tanks
        const tanksResult = await executeTanks();
        const tanksData = tanksResult?.data?.success ? tanksResult.data.result : [];
        setTanks(tanksData || []);

        // Charger les produits
        const produitsResult = await executeProduits();
        const produitsData = produitsResult?.data?.data ?? [];
        setProduits((produitsData || []).map(p => ({ id: p.id, nom: p.name })));
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les données"
        });
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [executeDepots, executeTanks, executeProduits, toast]);

  // Charger les données du delivery
  useEffect(() => {
    const fetchDelivery = async (entityId: string) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await findByIdAction(entityId);
        if (result.success && result.result) {
          const entity = result.result as z.infer<typeof EditDeliverySchema>;
          
          // Mettre à jour tous les champs
          setValue("deliveryDate", entity.deliveryDate ? new Date(entity.deliveryDate) : new Date());
          setValue("note", entity.note || "");
          setValue("clientId", entity.clientId || "");
          setValue("depotId", entity.depotId || "");
          setValue("tankId", entity.tankId || "");
          setValue("produitId", entity.produitId || "");
          setValue("quantity", entity.quantity || 0);
          setValue("unit", entity.unit || "L");
          setValue("openingEter", entity.openingEter || 0);
          setValue("closingEter", entity.closingEter || 0);
          setValue("timeStart", entity.timeStart || "");
          setValue("timeEnd", entity.timeEnd || "");
          setValue("prixUnitaire", entity.prixUnitaire || 0);
          setValue("paiement", entity.paiement || "CREDIT");
          setValue("typeAircraft", entity.typeAircraft || "");
          setValue("flightNumber", entity.flightNumber || "");
          setValue("linkDoc", entity.linkDoc || "");
        } else {
          const msg = result.failure || "Livraison introuvable.";
          setErrorMessage(msg);
          toast({
            variant: "destructive",
            title: "Erreur",
            description: msg,
          });
          setTimeout(() => router.push(`/dashboard/delivery`), 2000); 
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la livraison:", error);
        setErrorMessage("Impossible de charger la livraison. Veuillez réessayer.");
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger la livraison.",
        });
        setTimeout(() => router.push(`/dashboard/delivery`), 2000); 
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchDelivery(params.id as string);
    }
  }, [params.id, router, setValue, toast]);

  const onSubmit = async (data: z.infer<typeof EditDeliverySchema>) => {
    try {
      const result = await updateAction({
        id: params.id as string,
        deliveryDate: data.deliveryDate,
        note: data.note,
        clientId: data.clientId,
        depotId: data.depotId,
        tankId: data.tankId,
        produitId: data.produitId,
        quantity: data.quantity,
        unit: data.unit,
        openingEter: data.openingEter,
        closingEter: data.closingEter,
        timeStart: data.timeStart,
        timeEnd: data.timeEnd,
        prixUnitaire: data.prixUnitaire,
        paiement: data.paiement,
        typeAircraft: data.typeAircraft,
        flightNumber: data.flightNumber,
        linkDoc: data.linkDoc
      });
      
      if (!result?.data?.success) {
        throw new Error(result?.data?.failure || "Une erreur est survenue lors de la mise à jour.");
      }
      toast({ title: "Succès", description: "Livraison modifiée avec succès !" });
      router.push(`/dashboard/delivery`);
    } catch (e: unknown) {
      console.error("Erreur lors de la mise à jour:", e);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de la mise à jour: " + (e instanceof Error ? e.message : "Erreur inconnue"),
      });
    }
  };

  if (isLoading || loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-2 text-gray-500">
          Chargement des informations...
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
        <Button variant="outline" onClick={() => router.push(`/dashboard/delivery`)}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold">Modifier la Livraison Aviation</h1>
        </div>
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
                {errors.deliveryDate && <p className="text-red-500 text-sm">{errors.deliveryDate.message}</p>}
              </div>
              <div>
                <Label htmlFor="note">Note <span className="text-red-500">*</span></Label>
                <Input 
                  id="note" 
                  {...register("note")} 
                  placeholder="Numéro de note de livraison" 
                />
                {errors.note && <p className="text-red-500 text-sm">{errors.note.message}</p>}
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
                {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity.message}</p>}
              </div>
              <div>
                <Label htmlFor="unit">Unité <span className="text-red-500">*</span></Label>
                <Input 
                  id="unit" 
                  {...register("unit")} 
                  placeholder="Ex: L, M3" 
                />
                {errors.unit && <p className="text-red-500 text-sm">{errors.unit.message}</p>}
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
                {errors.prixUnitaire && <p className="text-red-500 text-sm">{errors.prixUnitaire.message}</p>}
              </div>

              <div>
                <Label htmlFor="paiement">Type de paiement <span className="text-red-500">*</span></Label>
                <Select onValueChange={(value) => setValue("paiement", value as "DIRECT" | "CREDIT")}>
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

            <div>
              <Label htmlFor="linkDoc">Lien du document</Label>
              <Input 
                id="linkDoc" 
                {...register("linkDoc")} 
                placeholder="URL ou lien de fichier (optionnel)" 
              />
              {errors.linkDoc && <p className="text-red-500 text-sm">{errors.linkDoc.message as string}</p>}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isSubmitting} className="px-8">
            {isSubmitting ? "Mise à jour..." : "Mettre à jour la livraison"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/dashboard/delivery')}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}