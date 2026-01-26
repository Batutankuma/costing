"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createShipment } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Truck, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { getClients } from "@/app/dashboard/clients/actions";
import { listDepots } from "@/app/dashboard/depots/actions";
import { listProducts } from "@/app/dashboard/products/actions";

const CreateShipmentSchema = z.object({
  numerobl: z.string().min(1, "Le numéro BL est requis"),
  date: z.date(),
  quantite: z.number().min(0.01, "La quantité doit être supérieure à 0"),
  unite: z.enum(["KG", "G", "L", "ML", "TONNE", "PIECE", "BOITE", "CAISSON", "POUCE", "METRE", "METRE_CARRE", "METRE_CUBE", "METRE_LINEAIRE"]),
  prixUnitaire: z.number().min(0).optional().nullable(),
  description: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  produitId: z.string().min(1, "Le produit est requis"),
  depotId: z.string().optional().nullable(),
});

type ShipmentFormData = z.infer<typeof CreateShipmentSchema>;

export default function CreateShipmentPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [clients, setClients] = useState<Array<{ id: string; name?: string; company?: string }>>([]);
  const [depots, setDepots] = useState<Array<{ id: string; name: string }>>([]);
  const [produits, setProduits] = useState<Array<{ id: string; name: string; unit: string }>>([]);
  const [loading, setLoading] = useState(true);

  const { executeAsync: executeDepots } = useAction(listDepots);
  const { executeAsync: executeProduits } = useAction(listProducts);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ShipmentFormData>({
    resolver: zodResolver(CreateShipmentSchema),
    defaultValues: {
      numerobl: "",
      date: new Date(),
      quantite: 0,
      unite: "L",
      prixUnitaire: null,
      description: null,
      clientId: null,
      produitId: "",
      depotId: null,
    }
  });

  const quantite = watch("quantite");
  const prixUnitaire = watch("prixUnitaire");
  const total = quantite && prixUnitaire ? (quantite * prixUnitaire).toFixed(2).replace(".", ",") : "0,00";

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
          name: c.name,
          company: c.company,
        }));
        setClients(mappedClients);

        // Charger les dépôts
        const depotsResult = await executeDepots();
        if (!isMounted) return;
        const depotsData = depotsResult?.data?.data ?? [];
        setDepots(depotsData.map((d: any) => ({ id: d.id, name: d.name })));

        // Charger les produits
        const produitsResult = await executeProduits();
        if (!isMounted) return;
        const produitsData = produitsResult?.data?.data ?? [];
        setProduits(produitsData.map((p: any) => ({ id: p.id, name: p.name, unit: p.unit })));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (data: ShipmentFormData) => {
    try {
      // Normaliser les données avant envoi
      const submitData = {
        ...data,
        clientId: data.clientId && data.clientId !== "" && data.clientId !== "none" ? data.clientId : null,
        depotId: data.depotId && data.depotId !== "" && data.depotId !== "none" ? data.depotId : null,
        prixUnitaire: data.prixUnitaire && data.prixUnitaire > 0 ? data.prixUnitaire : null,
        description: data.description && data.description !== "" ? data.description : null,
      };
      
   
      const result = await createShipment(submitData);
      
      if (!result?.data?.success) {
        toast({ 
          variant: "destructive",
          title: "Erreur", 
          description: result?.data?.failure || "Enregistrement impossible."
        });
        return;
      }
      toast({ 
        title: "Succès", 
        description: "Livraison créée avec succès !" 
      });
      router.push(`/dashboard/shipments`);
    } catch (e: unknown) {
      console.error("Erreur lors de la soumission:", e);
      const errorMessage = e instanceof Error ? e.message : "Une erreur est survenue lors de l'enregistrement.";
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: errorMessage
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/shipments">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div className="h-6 w-px bg-border" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouvelle Livraison</h1>
          <p className="text-muted-foreground">
            Ajoutez une nouvelle livraison à votre base de données
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Informations de la livraison
          </CardTitle>
          <CardDescription>
            Remplissez les informations ci-dessous pour créer une nouvelle livraison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="numerobl" className="text-sm font-medium">
                  Numéro BL <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="numerobl" 
                  placeholder="Ex: BL-2024-001" 
                  {...register("numerobl")}
                  className="h-10"
                />
                {errors.numerobl && (
                  <p className="text-sm text-destructive">{errors.numerobl.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">
                  Date <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="date" 
                  type="date"
                  {...register("date", { 
                    valueAsDate: true,
                    setValueAs: (value: string) => value ? new Date(value) : new Date()
                  })}
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="h-10"
                />
                {errors.date && (
                  <p className="text-sm text-destructive">{errors.date.message}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="clientId" className="text-sm font-medium">
                  Client
                </Label>
                <Select 
                  onValueChange={(value) => setValue("clientId", value === "none" ? null : value)}
                  value={watch("clientId") || "none"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun client</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name || client.company || "Sans nom"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="produitId" className="text-sm font-medium">
                  Produit <span className="text-destructive">*</span>
                </Label>
                <Select 
                  onValueChange={(value) => setValue("produitId", value)}
                  value={watch("produitId") || ""}
                >
                  <SelectTrigger>
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
                  <p className="text-sm text-destructive">{errors.produitId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="depotId" className="text-sm font-medium">
                  Dépôt
                </Label>
                <Select 
                  onValueChange={(value) => setValue("depotId", value === "none" ? null : value)}
                  value={watch("depotId") || "none"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un dépôt" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun dépôt</SelectItem>
                    {depots.map((depot) => (
                      <SelectItem key={depot.id} value={depot.id}>
                        {depot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="quantite" className="text-sm font-medium">
                  Quantité <span className="text-destructive">*</span>
                </Label>
                <Input 
                  id="quantite" 
                  type="number"
                  step="0.01"
                  placeholder="0.00" 
                  {...register("quantite", { valueAsNumber: true })}
                  className="h-10"
                />
                {errors.quantite && (
                  <p className="text-sm text-destructive">{errors.quantite.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unite" className="text-sm font-medium">
                  Unité <span className="text-destructive">*</span>
                </Label>
                <Select 
                  onValueChange={(value) => setValue("unite", value as any)}
                  value={watch("unite") || "L"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une unité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KG">KG</SelectItem>
                    <SelectItem value="G">G</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="ML">ML</SelectItem>
                    <SelectItem value="TONNE">TONNE</SelectItem>
                    <SelectItem value="PIECE">PIECE</SelectItem>
                    <SelectItem value="BOITE">BOITE</SelectItem>
                    <SelectItem value="CAISSON">CAISSON</SelectItem>
                    <SelectItem value="POUCE">POUCE</SelectItem>
                    <SelectItem value="METRE">METRE</SelectItem>
                    <SelectItem value="METRE_CARRE">METRE_CARRE</SelectItem>
                    <SelectItem value="METRE_CUBE">METRE_CUBE</SelectItem>
                    <SelectItem value="METRE_LINEAIRE">METRE_LINEAIRE</SelectItem>
                  </SelectContent>
                </Select>
                {errors.unite && (
                  <p className="text-sm text-destructive">{errors.unite.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="prixUnitaire" className="text-sm font-medium">
                  Prix Unitaire
                </Label>
                <Input 
                  id="prixUnitaire" 
                  type="text"
                  placeholder="0,00" 
                  {...register("prixUnitaire", {
                    setValueAs: (value: string) => {
                      if (!value || value.trim() === "") return null;
                      // Remplacer la virgule par un point pour la conversion
                      const normalizedValue = value.replace(",", ".");
                      const numValue = parseFloat(normalizedValue);
                      return isNaN(numValue) ? null : numValue;
                    }
                  })}
                  onChange={(e) => {
                    let value = e.target.value;
                    // Permettre seulement les chiffres, virgule et point
                    value = value.replace(/[^0-9,.]/g, "");
                    // Convertir tous les points en virgules
                    value = value.replace(/\./g, ",");
                    // Garder seulement la première virgule
                    const parts = value.split(",");
                    if (parts.length > 2) {
                      // Si plusieurs virgules, garder seulement la première
                      value = parts[0] + "," + parts.slice(1).join("");
                    }
                    e.target.value = value;
                    // Déclencher le changement pour react-hook-form
                    register("prixUnitaire").onChange(e);
                  }}
                  className="h-10"
                />
                {errors.prixUnitaire && (
                  <p className="text-sm text-destructive">{errors.prixUnitaire.message}</p>
                )}
              </div>
            </div>

            {prixUnitaire && quantite && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total:</span>
                  <span className="text-lg font-bold">{total}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>
              <Textarea 
                id="description" 
                placeholder="Description de la livraison (optionnel)" 
                {...register("description")}
                className="min-h-[100px]"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="flex-1 gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? "Enregistrement..." : "Enregistrer la livraison"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.back()}
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

