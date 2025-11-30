"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { createAction } from "../actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { CreateReceptionSchema } from "@/models/mvc";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, AlertTriangle, CheckCircle, List, Package, Search, Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Import des actions pour récupérer les données
import { findAllAction as findAllCommandes } from "@/app/dashboard/commande/actions";
import { listProducts } from "@/app/dashboard/products/actions";
import { findAllAction as findAllTanks } from "@/app/dashboard/tank/actions";
import { listDepots } from "@/app/dashboard/depots/actions";

// Types locaux minimaux
import { z } from "zod";
type CommandeLite = { id: string; reference?: string | null; produitId?: string | null; unit?: string | null; currentQuantity?: number; status?: string; depotId?: string | null; quantite?: number; quantity?: number };

export default function CreateReceptionPage() {
  const [commandes, setCommandes] = useState<CommandeLite[]>([]);
  const [produits, setProduits] = useState<Array<{ id: string; name: string }>>([]);
  const [tanks, setTanks] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [isInternalDepot, setIsInternalDepot] = useState<boolean | null>(null);
  const [selectedCommande, setSelectedCommande] = useState<CommandeLite | null>(null);
  const [quantityError, setQuantityError] = useState<string>("");
  const [commandeSearch, setCommandeSearch] = useState("");
  const [showCommandeSelector, setShowCommandeSelector] = useState(false);

  // Hooks pour les actions de récupération
  const { executeAsync: executeCommandes } = useAction(findAllCommandes);
  const { executeAsync: executeProduits } = useAction(listProducts);
  const { executeAsync: executeTanks } = useAction(findAllTanks);
  const { executeAsync: executeDepots } = useAction(listDepots);

  const { toast } = useToast();

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm({
    resolver: zodResolver(CreateReceptionSchema),
    defaultValues: {
      receptionDate: new Date(),
      reference: "",
      quantity: 0,
      unit: "L",
      receptionStatus: "RECEIVED",
      commandeId: "",
      produitId: "",
      tankId: undefined,
    }
  });

  // Surveiller les changements de commandeId et quantity
  const commandeId = watch("commandeId");
  const quantity = watch("quantity");

  // Filtrer les commandes selon la recherche
  const filteredCommandes = commandes.filter((commande) => {
    const searchTerm = commandeSearch.toLowerCase();
    return (
      (commande.reference || "").toLowerCase().includes(searchTerm) ||
      (commande.produitId || "").toLowerCase().includes(searchTerm) ||
      commande.id.toLowerCase().includes(searchTerm)
    );
  });

  // Grouper les commandes par statut
  const commandesByStatus = {
    confirmed: filteredCommandes.filter(c => c.status === "CONFIRMED"),
    partiallyReceived: filteredCommandes.filter(c => c.status === "PARTIALLY_RECEIVED"),
  };

  // Charger les données de référence
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        if (!isMounted) return;
        setLoading(true);

        const [cmdRes, prodRes, tankRes] = await Promise.allSettled([
          executeCommandes(),
          executeProduits(),
          executeTanks(),
        ]);

        if (!isMounted) return;

        // Commandes
        if (cmdRes.status === "fulfilled") {
          const r = cmdRes.value as any;
          if (r?.data?.success && r.data.result) {
            const available = ((r.data.result || []) as any[])
              .filter((c: any) => c.status === "CONFIRMED" || c.status === "PARTIALLY_RECEIVED") as CommandeLite[];
            setCommandes(available);
          }
        }

        // Produits
        if (prodRes.status === "fulfilled") {
          const r: any = prodRes.value;
          const produitsData = r?.data?.data ?? [];
          setProduits(produitsData || []);
        }

        // Tanks
        if (tankRes.status === "fulfilled") {
          const r: any = tankRes.value;
          if (r?.data?.success && r.data.result) {
            setTanks(r.data.result || []);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données" });
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Vérifier les paramètres d'URL pour pré-sélectionner une commande
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const commandeIdFromUrl = urlParams.get('commandeId');
      
      if (commandeIdFromUrl && commandes.length > 0) {
        const commande = commandes.find((c: CommandeLite) => c.id === commandeIdFromUrl);
        if (commande) {
          setValue("commandeId", commandeIdFromUrl);
          setSelectedCommande(commande);
          setValue("reference", commande.reference || "");
          setValue("produitId", commande.produitId || "");
          setValue("unit", (commande.unit as any) || "L");
        }
      }
    }
  }, [commandes, setValue]);

  // Mettre à jour la référence quand une commande est sélectionnée
  useEffect(() => {
    if (commandeId) {
      const commande = commandes.find((c: CommandeLite) => c.id === commandeId);
      if (commande) {
        setSelectedCommande(commande);
        setValue("reference", commande.reference || "");
        setValue("produitId", commande.produitId || "");
        setValue("unit", (commande.unit as any) || "L");
        clearErrors("quantity");
        setQuantityError("");
        setShowCommandeSelector(false);

        // Déterminer le type de dépôt (OWNED = interne → Tank requis, EXTERNAL → pas de Tank)
        (async () => {
          try {
            const depotsResult = await executeDepots();
            const depots = (depotsResult as any)?.data?.data ?? [];
            const depot = depots.find((d: any) => d.id === commande.depotId);
            const isInternal = depot?.type === 'OWNED';
            setIsInternalDepot(isInternal ?? null);
            if (isInternal === false) {
              setValue('tankId', undefined);
            }
          } catch {
            setIsInternalDepot(null);
          }
        })();
      }
    } else {
      setSelectedCommande(null);
      setIsInternalDepot(null);
    }
  }, [commandeId, commandes, setValue, clearErrors]);

  // Valider la quantité par rapport à la commande
  useEffect(() => {
    if (selectedCommande && quantity > 0) {
      const remainingQuantity = selectedCommande.currentQuantity ?? 0;
      
      if (quantity > remainingQuantity) {
        const errorMsg = `Quantité trop élevée. Il ne reste que ${remainingQuantity} ${(selectedCommande.unit || 'unités')} à recevoir sur cette commande.`;
        setQuantityError(errorMsg);
        setError("quantity", { message: errorMsg } as any);
      } else {
        setQuantityError("");
        clearErrors("quantity");
      }
    }
  }, [quantity, selectedCommande, setError, clearErrors]);

  const router = useRouter();
  const { executeAsync, isExecuting: isPending } = useAction(createAction);

  const onSubmit = async (data: any) => {
    // Validation finale avant soumission
    if (selectedCommande && data.quantity > (selectedCommande.currentQuantity ?? 0)) {
      toast({
        variant: "destructive",
        title: "Erreur de validation",
        description: `Impossible de recevoir ${data.quantity} ${data.unit}. Il ne reste que ${(selectedCommande.currentQuantity ?? 0)} ${(selectedCommande.unit || 'unités')} à recevoir.`,
      });
      return;
    }

    try {
      const result = await executeAsync(data);
      if (!result?.data?.success) {
        throw new Error(result?.data?.failure || "Erreur inconnue lors de l'enregistrement.");
      }
      
      // ✅ RAFRAÎCHIR LES DONNÉES après la création
      const commandesResult = await executeCommandes();
      if (commandesResult?.data?.success && commandesResult.data.result) {
        const availableCommandes = ((commandesResult.data.result || []) as any[])
          .filter((c: any) => c.status === "CONFIRMED" || c.status === "PARTIALLY_RECEIVED") as CommandeLite[];
        setCommandes(availableCommandes);
        
        if (selectedCommande) {
          const updatedCommande = availableCommandes.find((c: CommandeLite) => c.id === selectedCommande.id);
          if (updatedCommande) {
            setSelectedCommande(updatedCommande);
          }
        }
      }
      
      toast({ title: "Succès", description: "Réception ajoutée avec succès !" });
      router.push('/dashboard/operations/reception');
    } catch (e: unknown) {
      console.error("Erreur lors de la soumission du formulaire:", e);
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: e instanceof Error ? e.message : "Une erreur est survenue lors de l'enregistrement." 
      });
    }
  };

  const selectCommande = (commande: CommandeLite) => {
    setValue("commandeId", commande.id);
    setSelectedCommande(commande);
    setValue("reference", commande.reference || "");
    setValue("produitId", commande.produitId || "");
    setValue("unit", (commande.unit as any) || "L");
    setShowCommandeSelector(false);
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
    <div className="p-6 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Nouvelle Réception</h1>
      
      {/* Informations sur la commande sélectionnée */}
      {selectedCommande && (
        <Alert className={`mb-6 ${(selectedCommande.currentQuantity ?? 0) === 0 ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}`}>
          {(selectedCommande.currentQuantity ?? 0) === 0 ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <Info className="h-4 w-4 text-blue-600" />
          )}
          <AlertDescription className={(selectedCommande.currentQuantity ?? 0) === 0 ? 'text-green-800' : 'text-blue-800'}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <strong>Commande :</strong> {selectedCommande.reference}
              </div>
              <div>
                <strong>Quantité totale commandée :</strong> {selectedCommande.quantite ?? selectedCommande.quantity ?? 0} {selectedCommande.unit || 'unités'}
              </div>
              <div>
                <strong>Quantité restante à recevoir :</strong> 
                <span className={`font-bold ${(selectedCommande.currentQuantity ?? 0) > 0 ? 'text-blue-600' : 'text-green-600'}`}>
                  {(selectedCommande.currentQuantity ?? 0)} {selectedCommande.unit || 'unités'}
                </span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="reference">Référence</Label>
            <Input 
              id="reference" 
              placeholder="Référence automatique de la commande" 
              {...register("reference")} 
              readOnly
              className="bg-gray-50"
            />
            {errors.reference && <p className="text-red-500 text-sm">{errors.reference.message as any}</p>}
            <p className="text-xs text-gray-500 mt-1">
              La référence est automatiquement remplie à partir de la commande sélectionnée
            </p>
          </div>

          <div>
            <Label htmlFor="receptionDate">Date de réception <span className="text-red-500">*</span></Label>
            <Input 
              id="receptionDate" 
              type="datetime-local" 
              {...register("receptionDate", { 
                valueAsDate: true,
                setValueAs: (value) => new Date(value)
              })} 
            />
            {errors.receptionDate && <p className="text-red-500 text-sm">{errors.receptionDate.message as any}</p>}
          </div>

          <div>
            <Label htmlFor="quantity">Quantité <span className="text-red-500">*</span></Label>
            <Input 
              id="quantity" 
              type="number" 
              step="0.01" 
              placeholder="Quantité reçue" 
              {...register("quantity", { valueAsNumber: true })} 
              className={quantityError ? "border-red-500" : ""}
            />
            {quantityError && (
              <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                {quantityError}
              </div>
            )}
            {errors.quantity && !quantityError && <p className="text-red-500 text-sm">{errors.quantity.message as any}</p>}
            {selectedCommande && !quantityError && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Quantité valide - Il reste {(selectedCommande.currentQuantity ?? 0)} {selectedCommande.unit || 'unités'} à recevoir
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="unit">Unité <span className="text-red-500">*</span></Label>
            <Select onValueChange={(value) => setValue("unit", value as any)} defaultValue="L">
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une unité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KG">Kilogramme (KG)</SelectItem>
                <SelectItem value="G">Gramme (G)</SelectItem>
                <SelectItem value="L">Litre (L)</SelectItem>
                <SelectItem value="ML">Millilitre (ML)</SelectItem>
                <SelectItem value="TONNE">Tonne</SelectItem>
                <SelectItem value="PIECE">Pièce</SelectItem>
                <SelectItem value="BOITE">Boîte</SelectItem>
                <SelectItem value="CAISSON">Caisson</SelectItem>
                <SelectItem value="POUCE">Pouce</SelectItem>
                <SelectItem value="METRE">Mètre</SelectItem>
                <SelectItem value="METRE_CARRE">Mètre carré</SelectItem>
                <SelectItem value="METRE_CUBE">Mètre cube</SelectItem>
                <SelectItem value="METRE_LINEAIRE">Mètre linéaire</SelectItem>
              </SelectContent>
            </Select>
            {errors.unit && <p className="text-red-500 text-sm">{errors.unit.message as any}</p>}
          </div>

          <div className="relative">
            <Label htmlFor="commandeId">Commande <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Input 
                placeholder={selectedCommande ? `${selectedCommande.reference} - ${(selectedCommande.currentQuantity ?? 0)} ${selectedCommande.unit || 'unités'} restantes` : "Sélectionner une commande"}
                readOnly
                onClick={() => setShowCommandeSelector(!showCommandeSelector)}
                className="cursor-pointer bg-white"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute right-1 top-1 h-7 w-7 p-0"
                onClick={() => setShowCommandeSelector(!showCommandeSelector)}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            {/* Sélecteur de commande */}
            {showCommandeSelector && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                <div className="p-3 border-b border-gray-200">
                  <Input
                    placeholder="Rechercher une commande..."
                    value={commandeSearch}
                    onChange={(e) => setCommandeSearch(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="p-2">
                  {commandesByStatus.confirmed.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                        <Clock className="h-4 w-4 text-blue-600" />
                        Commandes confirmées ({commandesByStatus.confirmed.length})
                      </div>
                      {commandesByStatus.confirmed.map((commande) => (
                        <div key={commande.id} onClick={() => selectCommande(commande)} className="p-3 border border-gray-200 rounded-lg mb-2 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{commande.reference}</div>
                              <div className="text-sm text-gray-600">Produit ID: {commande.produitId}</div>
                            </div>
                            <div className="text-right">
                              <Badge variant="default" className="mb-1">
                                {(commande.currentQuantity ?? 0)} {commande.unit || 'unités'} restantes
                              </Badge>
                              <div className="text-xs text-gray-500">
                                Total: {commande.quantite ?? commande.quantity ?? 0} {commande.unit || 'unités'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {commandesByStatus.partiallyReceived.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                        <CheckCircle2 className="h-4 w-4 text-orange-600" />
                        Commandes partiellement reçues ({commandesByStatus.partiallyReceived.length})
                      </div>
                      {commandesByStatus.partiallyReceived.map((commande) => (
                        <div key={commande.id} onClick={() => selectCommande(commande)} className="p-3 border border-gray-200 rounded-lg mb-2 cursor-pointer hover:bg-orange-50 hover:border-orange-300 transition-colors">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{commande.reference}</div>
                              <div className="text-sm text-gray-600">Produit ID: {commande.produitId}</div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="mb-1">
                                {(commande.currentQuantity ?? 0)} {commande.unit || 'unités'} restantes
                              </Badge>
                              <div className="text-xs text-gray-500">
                                Total: {commande.quantite ?? commande.quantity ?? 0} {commande.unit || 'unités'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {filteredCommandes.length === 0 && (
                    <div className="p-4 text-center text-gray-500">Aucune commande trouvée</div>
                  )}
                </div>
              </div>
            )}
            {errors.commandeId && <p className="text-red-500 text-sm mt-1">{(errors as any).commandeId.message}</p>}
            <p className="text-xs text-gray-500 mt-1">Cliquez pour sélectionner une commande disponible</p>
          </div>

          <div>
            <Label htmlFor="produitId">Produit <span className="text-red-500">*</span></Label>
            <Select onValueChange={(value) => setValue("produitId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un produit" />
              </SelectTrigger>
              <SelectContent>
                {produits.map((produit) => (
                  <SelectItem key={produit.id} value={produit.id}>{produit.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.produitId && <p className="text-red-500 text-sm">{(errors as any).produitId.message}</p>}
          </div>

          {isInternalDepot ? (
            <div>
              <Label htmlFor="tankId">Tank</Label>
              <Select onValueChange={(value) => setValue("tankId", value === "none" ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un tank" />
                </SelectTrigger>
                <SelectContent>
                  {tanks.map((tank) => (
                    <SelectItem key={tank.id} value={tank.id}>{tank.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.tankId && <p className="text-red-500 text-sm">{(errors as any).tankId.message}</p>}
              <p className="text-xs text-gray-500 mt-1">Le Tank est requis pour un dépôt interne.</p>
            </div>
          ) : (
            <div>
              <Label>Tank</Label>
              <Input readOnly value="Non requis pour un dépôt externe" className="bg-gray-50" />
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Button 
            type="submit" 
            disabled={isPending || !!quantityError || ((selectedCommande?.currentQuantity ?? 0) === 0)}
            className={((selectedCommande?.currentQuantity ?? 0) === 0) ? "opacity-50 cursor-not-allowed" : ""}
          >
            {isPending ? "Enregistrement..." : 
             ((selectedCommande?.currentQuantity ?? 0) === 0) ? "Commande déjà reçue" : "Enregistrer"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/dashboard/operations/reception')}>
            Annuler
          </Button>
        </div>
      </form>
      <div className="flex items-center gap-3 mt-6">
        <Button variant="outline" onClick={() => router.push('/dashboard/operations/reception/list')}>
          <List className="h-4 w-4 mr-2" />
          Voir la liste
        </Button>
        <Button onClick={() => router.push('/dashboard/operations/reception')}>
          <Package className="h-4 w-4 mr-2" />
          Retour au tableau de bord
        </Button>
      </div>
    </div>
  );
}
