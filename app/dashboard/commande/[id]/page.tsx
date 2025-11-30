"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
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

import { CreateCommandeSchema } from "@/models/mvc";
import { findByIdAction, updateAction } from "../actions";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";

// Import des actions pour récupérer les données
import { listProducts } from "@/app/dashboard/products/actions";
import { findAllAction as findAllFournisseurs } from "@/app/dashboard/crm/fournisseur/actions";
import { listDepots } from "@/app/dashboard/depots/actions";

type CommandeForm = z.infer<typeof CreateCommandeSchema>;

export default function EditCommandePage({ params }: { params: Promise<{ id: string }> }) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [commandeId, setCommandeId] = useState<string | null>(null);
  const [produits, setProduits] = useState<any[]>([]);
  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  const [depots, setDepots] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // État simplifié pour les valeurs sélectionnées
  const [selectedValues, setSelectedValues] = useState({
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
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(CreateCommandeSchema),
    defaultValues: {
      status: "DRAFT",
      reference: "",
      produitId: "",
      depotId: "",
      devise: "USD",
      fournisseurId: "",
      quantite: 0,
      unitPrice: 0,
    },
  });

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
    const loadReferenceData = async () => {
      try {
        setLoadingData(true);
        
        // Charger les produits
        const produitsResult = await executeProduits();
        const produitsData = (produitsResult as any)?.data?.data ?? [];
        setProduits(produitsData || []);

        // Charger les fournisseurs
        const fournisseursResult = await executeFournisseurs();
        if (fournisseursResult?.data?.success && fournisseursResult.data.result) {
          setFournisseurs(fournisseursResult.data.result || []);
        }

        // Charger les dépôts
        const depotsResult = await executeDepots();
        const depotsData = (depotsResult as any)?.data?.data ?? [];
        setDepots(depotsData || []);
      } catch (error) {
        console.error("Erreur lors du chargement des données de référence:", error);
      } finally {
        setLoadingData(false);
      }
    };

    loadReferenceData();
  }, [executeProduits, executeFournisseurs, executeDepots]);

  useEffect(() => {
    const fetchCommande = async (entityId: string) => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const result = await findByIdAction(entityId);
        if ((result as any).success && (result as any).result) {
          const entity = (result as any).result as any;
          
          // Mettre à jour les valeurs du formulaire
          setValue("status", entity.status);
          setValue("reference", entity.reference);
          setValue("produitId", entity.produitId);
          setValue("depotId", entity.depotId);
          setValue("devise", entity.devise);
          setValue("fournisseurId", entity.fournisseurId);
          setValue("quantite", entity.quantite);
          setValue("unitPrice", entity.unitPrice);
          
          // Mettre à jour l'état des valeurs sélectionnées
          setSelectedValues({
            status: entity.status,
            produitId: entity.produitId,
            depotId: entity.depotId,
            fournisseurId: entity.fournisseurId,
            devise: entity.devise,
            
          });
        } else {
          const msg = (result as any).failure || "Commande introuvable.";
          setErrorMessage(msg);
          toast({
            variant: "destructive",
            title: "Erreur",
            description: msg,
          });
          setTimeout(() => router.push(`/dashboard/operations/commande`), 2000); 
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la commande:", error);
        setErrorMessage("Impossible de charger la commande. Veuillez réessayer.");
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger la commande.",
        });
        setTimeout(() => router.push(`/dashboard/operations/commande`), 2000); 
      } finally {
        setIsLoading(false);
      }
    };

    if (commandeId) {
      fetchCommande(commandeId);
    }
  }, [commandeId, router, setValue, toast]);

  

  const onSubmit = async (data: CommandeForm) => {
    try {
      if (!commandeId) return;
      
      const result = await executeUpdate({ id: commandeId, ...data });
      
      if (result?.data?.success) {
        toast({ title: "Succès", description: "Commande modifiée avec succès !" });
        router.push(`/dashboard/operations/commande`);
      } else {
        throw new Error(result?.data?.failure || "Une erreur est survenue lors de la mise à jour.");
      }
    } catch (e: unknown) {
      console.error("Erreur lors de la mise à jour:", e);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Erreur lors de la mise à jour: " + (e instanceof Error ? e.message : "Erreur inconnue"),
      });
    }
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
        <Button variant="outline" onClick={() => router.push(`/dashboard/operations/commande`)}>
          Retour à la liste
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Modifier la Commande</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <Label htmlFor="status">Statut <span className="text-red-500">*</span></Label>
            <Select
              value={selectedValues.status}
              onValueChange={(value: CommandeForm['status']) => {
                setValue("status", value);
                setSelectedValues(prev => ({ ...prev, status: value }));
              }}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Brouillon</SelectItem>
                <SelectItem value="CONFIRMED">Confirmé</SelectItem>
                <SelectItem value="COMPLETED">Terminé</SelectItem>
                <SelectItem value="CANCELLED">Annulé</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && <p className="text-red-500 text-sm">{errors.status.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="produitId">
              Produit <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedValues.produitId}
              onValueChange={(value: string) => {
                setValue("produitId", value);
                setSelectedValues(prev => ({ ...prev, produitId: value }));
              }}
            >
              <SelectTrigger id="produitId">
                <SelectValue placeholder="Sélectionner un produit" />
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
            <Label htmlFor="depotId">
              Dépôt <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedValues.depotId}
              onValueChange={(value: string) => {
                setValue("depotId", value);
                setSelectedValues(prev => ({ ...prev, depotId: value }));
              }}
            >
              <SelectTrigger id="depotId">
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
            {errors.depotId && (
              <p className="text-red-500 text-sm">{errors.depotId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fournisseurId">
              Fournisseur <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedValues.fournisseurId}
              onValueChange={(value: string) => {
                setValue("fournisseurId", value);
                setSelectedValues(prev => ({ ...prev, fournisseurId: value }));
              }}
            >
              <SelectTrigger id="fournisseurId">
                <SelectValue placeholder="Sélectionner un fournisseur" />
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

          <div className="space-y-2">
            <Label htmlFor="devise">Devise <span className="text-red-500">*</span></Label>
              <Select
              value={selectedValues.devise}
              onValueChange={(value: string) => {
                setValue("devise", value as any);
                setSelectedValues(prev => ({ ...prev, devise: value }));
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

          

          <div className="space-y-2">
              <Label htmlFor="quantite">
              Quantité Totale <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="quantite" 
              type="number" 
              placeholder="Quantité totale" 
              {...register("quantite", { valueAsNumber: true })} 
            />
            {errors.quantite && (
              <p className="text-red-500 text-sm">{(errors as any).quantite.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="unitPrice">
              Prix Unitaire <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="unitPrice" 
              type="number" 
              step="0.01"
              placeholder="Prix unitaire" 
              {...register("unitPrice", { valueAsNumber: true })} 
            />
            {errors.unitPrice && (
              <p className="text-red-500 text-sm">{errors.unitPrice.message}</p>
            )}
          </div>

          
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Mise à jour..." : "Mettre à jour"}
        </Button>
      </form>
    </div>
  );
}