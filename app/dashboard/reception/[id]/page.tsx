"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAction } from "next-safe-action/hooks";
import { useRouter, useParams } from "next/navigation";
import { updateAction, findByIdAction } from "../actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { CreateReceptionSchema, CreateReception, Commande, Produit, Tank, Reception } from "@/models/mvc";
// Basic inline Alert components as fallback
const Alert = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <div className={`p-4 rounded-md border ${className}`}>{children}</div>
);
const AlertDescription = ({ className = "", children }: { className?: string; children: React.ReactNode }) => (
  <div className={className}>{children}</div>
);
import { Info, AlertTriangle, CheckCircle, Save, List, Package } from "lucide-react";

// Import des actions pour récupérer les données
import { findAllAction as findAllCommandes } from "@/app/dashboard/commande/actions";
import { listProducts } from "@/app/dashboard/products/actions";
import { findAllAction as findAllTanks } from "@/app/dashboard/tank/actions";

export default function EditReceptionPage() {
  const params = useParams();
  const receptionId = params.id as string;
  
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [reception, setReception] = useState<Reception | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null);
  const [quantityError, setQuantityError] = useState<string>("");

  // Hooks pour les actions
  const { executeAsync: executeCommandes } = useAction(findAllCommandes);
  const { executeAsync: executeTanks } = useAction(findAllTanks);


  const { toast } = useToast();
  const router = useRouter();

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm<CreateReception & { id: string }>({
    resolver: zodResolver(z.object({
      id: z.string().uuid(),
      receptionDate: z.date(),
      reference: z.string().optional(),
      quantity: z.number().min(0),
      unit: z.enum(["KG", "G", "L", "ML", "TONNE", "PIECE", "BOITE", "CAISSON", "POUCE", "METRE", "METRE_CARRE", "METRE_CUBE", "METRE_LINEAIRE"]),
      notes: z.string().optional(),
      receptionStatus: z.enum(["RECEIVED", "IN_TRANSIT", "CANCELLED"]),
      commandeId: z.string().uuid(),
      produitId: z.string().uuid(),
      tankId: z.string().uuid().optional(),
      stockEntryId: z.string().uuid().optional(),
      user: z.string().uuid().optional()
    })),
    defaultValues: {
      id: receptionId,
      receptionDate: new Date(),
      reference: "",
      quantity: 0,
      unit: "L",
      notes: "",
      receptionStatus: "RECEIVED",
      commandeId: "",
      produitId: "",
      tankId: undefined,
    }
  });

  // Surveiller les changements
  const commandeId = watch("commandeId");
  const quantity = watch("quantity");

  // Charger les données initiales
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Charger la réception à modifier
        const receptionResult = await findByIdAction(receptionId);
        if (receptionResult?.success && receptionResult.result) {
          const receptionData = receptionResult.result;
          setReception(receptionData);
          
          // Pré-remplir le formulaire
          setValue("receptionDate", new Date(receptionData.receptionDate));
          setValue("reference", receptionData.reference || "");
          setValue("quantity", receptionData.quantity);
          setValue("unit", receptionData.unit);
          setValue("notes", receptionData.notes || "");
          setValue("receptionStatus", receptionData.receptionStatus);
          setValue("commandeId", receptionData.commandeId);
          setValue("produitId", receptionData.produitId);
          setValue("tankId", receptionData.tankId);
        }

        // Charger les commandes
        const commandesResult = await executeCommandes();
        if (commandesResult?.data?.success && commandesResult.data.result) {
          const confirmedCommandes = (commandesResult.data.result || [])
            .filter((c: Commande) => c.status === "CONFIRMED" || c.status === "PARTIALLY_RECEIVED");
          setCommandes(confirmedCommandes);
        }

        // Charger les produits
        const produitsResult = await listProducts();
        const produitsData = produitsResult?.data?.data ?? [];
        setProduits(produitsData || []);

        // Charger les tanks
        const tanksResult = await executeTanks();
        if (tanksResult?.data?.success && tanksResult.data.result) {
          setTanks(tanksResult.data.result || []);
        }
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

    if (receptionId) {
      loadData();
    }
  }, [receptionId, executeCommandes, executeTanks, setValue, toast]);

  // Mettre à jour la référence quand une commande est sélectionnée
  useEffect(() => {
    if (commandeId) {
      const commande = commandes.find((c: Commande) => c.id === commandeId);
      if (commande) {
        setSelectedCommande(commande);
        setValue("reference", commande.reference);
        setValue("produitId", commande.produitId);
        setValue("unit", commande.unit || "L");
        clearErrors("quantity");
        setQuantityError("");
      }
    } else {
      setSelectedCommande(null);
    }
  }, [commandeId, commandes, setValue, clearErrors]);

  // Valider la quantité par rapport à la commande
  useEffect(() => {
    if (selectedCommande && quantity > 0) {
      const remainingQuantity = selectedCommande.currentQuantity;
      
      if (quantity > remainingQuantity) {
        const errorMsg = `Quantité trop élevée. Il ne reste que ${remainingQuantity} ${selectedCommande.unit || 'unités'} à recevoir sur cette commande.`;
        setQuantityError(errorMsg);
        setError("quantity", { message: errorMsg });
      } else {
        setQuantityError("");
        clearErrors("quantity");
      }
    }
  }, [quantity, selectedCommande, setError, clearErrors]);

  const { executeAsync: executeUpdate, isExecuting: isPending } = useAction(updateAction);

  const onSubmit = async (data: z.infer<typeof CreateReceptionSchema> & { id: string }) => {
    // Validation finale avant soumission
    if (selectedCommande && data.quantity > selectedCommande.currentQuantity) {
      toast({
        variant: "destructive",
        title: "Erreur de validation",
        description: `Impossible de recevoir ${data.quantity} ${data.unit}. Il ne reste que ${selectedCommande.currentQuantity} ${selectedCommande.unit || 'unités'} à recevoir.`
      });
      return;
    }

    try {
      const result = await executeUpdate(data);
      if (!result?.data?.success) {
        throw new Error(result?.data?.failure || "Erreur inconnue lors de la modification.");
      }
      toast({ title: "Succès", description: "Réception modifiée avec succès !" });
      router.push('/dashboard/operations/reception');
    } catch (e: unknown) {
      console.error("Erreur lors de la soumission du formulaire:", e);
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: e instanceof Error ? e.message : "Une erreur est survenue lors de la modification." 
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

  if (!reception) {
    return (
      <div className="p-6 max-w-6xl">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-600">Réception non trouvée</h2>
          <p className="text-gray-600 mt-2">La réception que vous essayez de modifier n&apos;existe pas.</p>
          <Button 
            className="mt-4" 
            onClick={() => router.push('/dashboard/operations/reception')}
          >
            Retour aux réceptions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Modifier la Réception</h1>
          <p className="text-muted-foreground">
            Modification de la réception {reception.reference || reception.id}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => router.push('/dashboard/operations/reception/list')}
          >
            <List className="h-4 w-4 mr-2" />
            Voir la liste
          </Button>
          <Button onClick={() => router.push('/dashboard/operations/reception')}>
            <Package className="h-4 w-4 mr-2" />
            Retour au tableau de bord
          </Button>
        </div>
      </div>

      {/* Informations sur la réception actuelle */}
      <Alert className="mb-6 border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <strong>Réception actuelle :</strong> {reception.reference || reception.id}
            </div>
            <div>
              <strong>Quantité actuelle :</strong> {reception.quantity} {reception.unit}
            </div>
            <div>
              <strong>Date de réception :</strong> {new Date(reception.receptionDate).toLocaleDateString()}
            </div>
          </div>
          <div className="mt-2 p-2 bg-yellow-100 rounded border border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600 inline mr-2" />
            <span className="text-yellow-700 font-medium">
              Attention : La modification de cette réception annulera tous les effets précédents et les réappliquera avec les nouvelles données.
            </span>
          </div>
        </AlertDescription>
      </Alert>

      {/* Informations sur la commande sélectionnée */}
      {selectedCommande && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <strong>Commande :</strong> {selectedCommande.reference}
              </div>
              <div>
                <strong>Quantité totale commandée :</strong> {selectedCommande.quantity} {selectedCommande.unit || 'unités'}
              </div>
              <div>
                <strong>Quantité restante à recevoir :</strong> 
                <span className={`font-bold ${selectedCommande.currentQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedCommande.currentQuantity} {selectedCommande.unit || 'unités'}
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
            {errors.reference && <p className="text-red-500 text-sm">{errors.reference.message}</p>}
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
            {errors.receptionDate && <p className="text-red-500 text-sm">{errors.receptionDate.message}</p>}
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
            {errors.quantity && !quantityError && <p className="text-red-500 text-sm">{errors.quantity.message}</p>}
            {selectedCommande && !quantityError && (
              <p className="text-xs text-green-600 mt-1">
                ✓ Quantité valide - Il reste {selectedCommande.currentQuantity} {selectedCommande.unit || 'unités'} à recevoir
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="unit">Unité <span className="text-red-500">*</span></Label>
            <Select onValueChange={(value) => setValue("unit", value as "KG" | "G" | "L" | "ML" | "TONNE" | "PIECE" | "BOITE" | "CAISSON" | "POUCE" | "METRE" | "METRE_CARRE" | "METRE_CUBE" | "METRE_LINEAIRE")} defaultValue="L">
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
            {errors.unit && <p className="text-red-500 text-sm">{errors.unit.message}</p>}
          </div>

          <div>
            <Label htmlFor="receptionStatus">Statut <span className="text-red-500">*</span></Label>
            <Select onValueChange={(value) => setValue("receptionStatus", value as "RECEIVED" | "IN_TRANSIT" | "CANCELLED")} defaultValue="RECEIVED">
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RECEIVED">Reçue</SelectItem>
                <SelectItem value="IN_TRANSIT">En transit</SelectItem>
                <SelectItem value="CANCELLED">Annulée</SelectItem>
              </SelectContent>
            </Select>
            {errors.receptionStatus && <p className="text-red-500 text-sm">{errors.receptionStatus.message}</p>}
          </div>

          <div>
            <Label htmlFor="commandeId">Commande <span className="text-red-500">*</span></Label>
            <Select onValueChange={(value) => setValue("commandeId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une commande" />
              </SelectTrigger>
              <SelectContent>
                {commandes.map((commande: Commande) => (
                  <SelectItem key={commande.id} value={commande.id}>
                    {commande.reference} - {commande.currentQuantity} {commande.unit || 'unités'} restantes
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.commandeId && <p className="text-red-500 text-sm">{errors.commandeId.message}</p>}
          </div>

          <div>
            <Label htmlFor="produitId">Produit <span className="text-red-500">*</span></Label>
            <Select onValueChange={(value) => setValue("produitId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un produit" />
              </SelectTrigger>
              <SelectContent>
                {produits.map((produit: Produit) => (
                  <SelectItem key={produit.id} value={produit.id}>
                    {produit.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.produitId && <p className="text-red-500 text-sm">{errors.produitId.message}</p>}
          </div>

          <div>
            <Label htmlFor="tankId">Tank</Label>
            <Select onValueChange={(value) => setValue("tankId", value === "none" ? undefined : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un tank (optionnel)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun tank</SelectItem>
                {tanks.map((tank: Tank) => (
                  <SelectItem key={tank.id} value={tank.id}>
                    {tank.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tankId && <p className="text-red-500 text-sm">{errors.tankId.message}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Notes</Label>
          <textarea 
            id="notes" 
            placeholder="Notes sur la réception" 
            {...register("notes")} 
            className="w-full p-2 border rounded-md"
            rows={3}
          />
          {errors.notes && <p className="text-red-500 text-sm">{errors.notes.message}</p>}
        </div>

        <div className="flex gap-4">
          <Button 
            type="submit" 
            disabled={isPending || !!quantityError}
          >
            <Save className="mr-2 h-4 w-4" />
            {isPending ? "Modification..." : "Modifier la réception"}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push('/dashboard/operations/reception')}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}