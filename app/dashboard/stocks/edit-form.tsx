"use client";

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
import { Separator } from "@/components/ui/separator";
import { Save, Calendar, Hash, Warehouse, Users, Calculator, DollarSign, AlertTriangle, ArrowRightLeft, Package } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

import { CreateStockSchema, TypeStockEnum, UniteEnum, DeviseEnum } from "@/models/mvc";
import { updateAction } from "./actions";
import { z } from "zod";

const stockFormSchema = CreateStockSchema.extend({
  date: z.string().min(1, "La date est requise"),
});

type StockFormData = z.infer<typeof stockFormSchema>;

interface EditStockFormProps {
  initialStock: any;
  productSuggestions: Array<{ id: string; name: string; unit: string }>;
  fournisseurSuggestions: Array<{ id: string; nom: string }>;
  clientSuggestions: Array<{ id: string; name: string }>;
  depotSuggestions: Array<{ id: string; name: string }>;
}

export default function EditStockForm({
  initialStock,
  productSuggestions,
  fournisseurSuggestions,
  clientSuggestions,
  depotSuggestions,
}: EditStockFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [prixDisplay, setPrixDisplay] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StockFormData>({
    resolver: zodResolver(stockFormSchema),
    defaultValues: {
      date: initialStock.date ? new Date(initialStock.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      reference: initialStock.reference || "",
      depotId: initialStock.depotId || undefined,
      type: initialStock.type || TypeStockEnum.enum.ENTREE,
      fournisseurId: initialStock.fournisseurId || undefined,
      clientId: initialStock.clientId || undefined,
      produitId: initialStock.produitId,
      quantite: initialStock.quantite ?? 0,
      prixUnitaireAchat: initialStock.prixUnitaireAchat || undefined,
      unite: initialStock.unite || UniteEnum.enum.L,
      devise: initialStock.devise || DeviseEnum.enum.USD,
      seuilMinimum: initialStock.seuilMinimum ?? 0,
    },
  });

  const stockType = watch("type");

  // Initialiser l'affichage du prix avec virgule
  useEffect(() => {
    if (initialStock.prixUnitaireAchat != null && stockType === "ENTREE") {
      setPrixDisplay(String(initialStock.prixUnitaireAchat).replace('.', ','));
    }
  }, [initialStock.prixUnitaireAchat, stockType]);

  const handlePrixChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Autoriser les virgules et les points décimaux
    const value = inputValue.replace(',', '.');
    setPrixDisplay(inputValue); // Garder l'affichage avec virgule
    setValue('prixUnitaireAchat', value ? parseFloat(value) : null, { shouldValidate: true });
  };

  const onSubmit = async (data: StockFormData) => {
    try {
      // Convertir la date string en Date
      const stockData = {
        ...data,
        id: initialStock.id,
        date: new Date(data.date),
      };

      const result = await updateAction(stockData);

      if (!result?.data?.success || result?.data?.failure) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result?.data?.failure || "Une erreur est survenue lors de la mise à jour.",
        });
        return;
      }

      toast({ title: "Succès", description: "Stock modifié avec succès !" });
      router.push(`/dashboard/stocks`);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Une erreur est survenue lors de la mise à jour.";
      toast({
        variant: "destructive",
        title: "Erreur",
        description: errorMessage,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Informations du mouvement de stock
        </CardTitle>
        <CardDescription>
          Remplissez les informations ci-dessous pour modifier ce mouvement de stock
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section: Informations générales */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Informations générales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">
                  Date <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    {...register("date")}
                    className="h-10 pl-10"
                  />
                </div>
                {errors.date && (
                  <p className="text-sm text-destructive">{errors.date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference" className="text-sm font-medium">
                  Référence <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reference"
                    placeholder="Référence du mouvement"
                    {...register("reference")}
                    className="h-10 pl-10"
                  />
                </div>
                {errors.reference && (
                  <p className="text-sm text-destructive">{errors.reference.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Section: Type et Dépôt */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Type de mouvement et Dépôt
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">
                  Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(value: "ENTREE" | "SORTIE") => setValue("type", value)}
                  value={stockType}
                >
                  <SelectTrigger id="type" className="h-10">
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTREE">Entrée (Réception)</SelectItem>
                    <SelectItem value="SORTIE">Sortie (Livraison)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-destructive">{errors.type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="depotId" className="text-sm font-medium">
                  Dépôt
                </Label>
                <div className="relative">
                  <Warehouse className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Select
                    onValueChange={(value: string) => setValue("depotId", value)}
                    value={watch("depotId") || undefined}
                  >
                    <SelectTrigger id="depotId" className="h-10 pl-10">
                      <SelectValue placeholder="Sélectionner un dépôt" />
                    </SelectTrigger>
                    <SelectContent>
                      {depotSuggestions.map((depot) => (
                        <SelectItem key={depot.id} value={depot.id}>
                          {depot.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {errors.depotId && (
                  <p className="text-sm text-destructive">{errors.depotId.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Section: Fournisseur/Client selon le type */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              {stockType === "ENTREE" ? "Fournisseur" : "Client"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stockType === "ENTREE" ? (
                <div className="space-y-2">
                  <Label htmlFor="fournisseurId" className="text-sm font-medium">
                    Fournisseur
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Select
                      onValueChange={(value: string) => setValue("fournisseurId", value)}
                      value={watch("fournisseurId") || undefined}
                    >
                      <SelectTrigger id="fournisseurId" className="h-10 pl-10">
                        <SelectValue placeholder="Sélectionner un fournisseur" />
                      </SelectTrigger>
                      <SelectContent>
                        {fournisseurSuggestions.map((fournisseur) => (
                          <SelectItem key={fournisseur.id} value={fournisseur.id}>
                            {fournisseur.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.fournisseurId && (
                    <p className="text-sm text-destructive">{errors.fournisseurId.message}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="clientId" className="text-sm font-medium">
                    Client
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Select
                      onValueChange={(value: string) => setValue("clientId", value)}
                      value={watch("clientId") || undefined}
                    >
                      <SelectTrigger id="clientId" className="h-10 pl-10">
                        <SelectValue placeholder="Sélectionner un client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientSuggestions.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.clientId && (
                    <p className="text-sm text-destructive">{errors.clientId.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Section: Produit et Quantité */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produit et Quantité
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="produitId" className="text-sm font-medium">
                  Produit <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Select
                    onValueChange={(value: string) => setValue("produitId", value)}
                    value={watch("produitId")}
                  >
                    <SelectTrigger id="produitId" className="h-10 pl-10">
                      <SelectValue placeholder="Sélectionner un produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {productSuggestions.map((produit) => (
                        <SelectItem key={produit.id} value={produit.id}>
                          {produit.name} ({produit.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {errors.produitId && (
                  <p className="text-sm text-destructive">{errors.produitId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantite" className="text-sm font-medium">
                  Quantité <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Calculator className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="quantite"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    {...register("quantite", { valueAsNumber: true })}
                    className="h-10 pl-10"
                  />
                </div>
                {errors.quantite && (
                  <p className="text-sm text-destructive">{errors.quantite.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Section: Prix */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {stockType === "ENTREE" ? "Prix unitaire d'achat" : "Prix unitaire (CMP automatique)"}
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {stockType === "ENTREE" ? (
                <div className="space-y-2">
                  <Label htmlFor="prixUnitaireAchat" className="text-sm font-medium">
                    Prix unitaire d'achat
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="prixUnitaireAchat"
                      type="text"
                      placeholder="0,00 (ex: 0,893)"
                      value={prixDisplay}
                      onChange={handlePrixChange}
                      className="h-10 pl-10"
                    />
                  </div>
                  {errors.prixUnitaireAchat && (
                    <p className="text-sm text-destructive">{errors.prixUnitaireAchat.message}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Prix unitaire
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      value="Calculé automatiquement (CMP)"
                      disabled
                      className="h-10 pl-10 bg-muted"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Le prix sera calculé automatiquement selon le Coût Moyen Pondéré du stock actuel
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Section: Unité et Devise */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Unité et Devise</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unite" className="text-sm font-medium">
                  Unité <span className="text-destructive">*</span>
                </Label>
                <Select
                  onValueChange={(value: any) => setValue("unite", value)}
                  value={watch("unite")}
                >
                  <SelectTrigger id="unite" className="h-10">
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
                    <SelectItem value="POUCE">Pouce</SelectItem>
                    <SelectItem value="METRE">Mètre</SelectItem>
                    <SelectItem value="METRE_CARRE">Mètre carré</SelectItem>
                    <SelectItem value="METRE_CUBE">Mètre cube</SelectItem>
                    <SelectItem value="METRE_LINEAIRE">Mètre linéaire</SelectItem>
                  </SelectContent>
                </Select>
                {errors.unite && (
                  <p className="text-sm text-destructive">{errors.unite.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="devise" className="text-sm font-medium">
                  Devise <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Select
                    onValueChange={(value: any) => setValue("devise", value)}
                    value={watch("devise")}
                  >
                    <SelectTrigger id="devise" className="h-10 pl-10">
                      <SelectValue placeholder="Sélectionner une devise" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XOF">Franc CFA (XOF)</SelectItem>
                      <SelectItem value="USD">Dollar US (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                      <SelectItem value="CDF">Franc Congolais (CDF)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {errors.devise && (
                  <p className="text-sm text-destructive">{errors.devise.message}</p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Section: Seuil minimum */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Seuil minimum
            </h3>
            <div className="space-y-2">
              <Label htmlFor="seuilMinimum" className="text-sm font-medium">
                Seuil minimum <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="seuilMinimum"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  {...register("seuilMinimum", { valueAsNumber: true })}
                  className="h-10 pl-10"
                />
              </div>
              {errors.seuilMinimum && (
                <p className="text-sm text-destructive">{errors.seuilMinimum.message}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Mise à jour..." : "Mettre à jour le mouvement"}
            </Button>
            <Link href="/dashboard/stocks">
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
