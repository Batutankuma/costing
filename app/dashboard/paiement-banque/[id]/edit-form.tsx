"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PaiementBanqueSchema } from "@/models/mvc";
import { updatePaiementBanque } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Save, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { findAllAction as findAllCommandes } from "@/app/dashboard/commande/actions";
import { findAllBanquesAction } from "@/app/dashboard/banque/actions";
import { Loader2 } from "lucide-react";

type FormInput = z.input<typeof PaiementBanqueSchema>;
type FormOutput = z.infer<typeof PaiementBanqueSchema>;

type CommandeRef = {
  id: string;
  reference: string;
};

type BanqueRef = {
  id: string;
  nom: string;
};

interface EditFormProps {
  id: string;
  initial: { 
    commandeId: string;
    banqueId: string;
    statusPaiement: "EN_ATTENTE" | "PAYE" | "PARTIEL" | "ANNULE";
    datePaiement?: Date | null;
    montant?: number | null;
  };
  onCancel?: () => void;
  onSuccess?: () => void;
}

export default function EditForm({ id, initial, onCancel, onSuccess }: EditFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commandes, setCommandes] = useState<CommandeRef[]>([]);
  const [banques, setBanques] = useState<BanqueRef[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { executeAsync: executeCommandes } = useAction(findAllCommandes);
  const { executeAsync: executeBanques } = useAction(findAllBanquesAction);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [commandesResult, banquesResult] = await Promise.all([
          executeCommandes(),
          executeBanques(),
        ]);
        if (commandesResult?.data?.success) {
          const commandesData = commandesResult.data.result || [];
          setCommandes(commandesData.map((c: any) => ({ id: c.id, reference: c.reference })));
        }
        if (banquesResult?.data?.success) {
          setBanques(banquesResult.data.result || []);
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [executeCommandes, executeBanques]);
  
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(PaiementBanqueSchema),
    defaultValues: { 
      id,
      commandeId: initial.commandeId,
      banqueId: initial.banqueId,
      statusPaiement: initial.statusPaiement,
      datePaiement: initial.datePaiement || undefined,
      montant: initial.montant || undefined,
    },
  });

  const onSubmit = async (data: FormOutput) => {
    setIsSubmitting(true);
    try {
      const res = await updatePaiementBanque({ ...data, id });
      if (!res?.data?.success) {
        toast({ 
          variant: "destructive", 
          title: "Erreur", 
          description: res?.data?.failure || "Mise à jour échouée" 
        });
        return;
      }
      toast({ 
        title: "Succès", 
        description: "Paiement banque modifié avec succès" 
      });
      onSuccess?.();
      router.push("/dashboard/paiement-banque");
    } catch {
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: "Une erreur est survenue lors de la mise à jour" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          Modifier le paiement banque
        </CardTitle>
        <CardDescription>
          Mettez à jour les informations du paiement
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Chargement des données...</span>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="commandeId" className="text-sm font-medium">
                Bon de Commande <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="commandeId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={loading || commandes.length === 0}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Sélectionner une commande" />
                    </SelectTrigger>
                    <SelectContent>
                      {commandes.map((commande) => (
                        <SelectItem key={commande.id} value={commande.id}>
                          {commande.reference}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.commandeId && (
                <p className="text-sm text-destructive">{errors.commandeId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="banqueId" className="text-sm font-medium">
                Banque Réceptrice <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="banqueId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={loading || banques.length === 0}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Sélectionner une banque" />
                    </SelectTrigger>
                    <SelectContent>
                      {banques.map((banque) => (
                        <SelectItem key={banque.id} value={banque.id}>
                          {banque.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.banqueId && (
                <p className="text-sm text-destructive">{errors.banqueId.message}</p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="statusPaiement" className="text-sm font-medium">
                Status de Paiement <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="statusPaiement"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Sélectionner le statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                      <SelectItem value="PAYE">Payé</SelectItem>
                      <SelectItem value="PARTIEL">Partiel</SelectItem>
                      <SelectItem value="ANNULE">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.statusPaiement && (
                <p className="text-sm text-destructive">{errors.statusPaiement.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="datePaiement" className="text-sm font-medium">
                Date de Paiement
              </Label>
              <Input
                id="datePaiement"
                type="date"
                {...register("datePaiement", {
                  setValueAs: (value) => value ? new Date(value) : null
                })}
                defaultValue={initial.datePaiement ? new Date(initial.datePaiement).toISOString().split('T')[0] : ""}
                className="h-10"
              />
              {errors.datePaiement && (
                <p className="text-sm text-destructive">{errors.datePaiement.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="montant" className="text-sm font-medium">
              Montant
            </Label>
            <Input 
              id="montant" 
              type="number" 
              step="0.01"
              placeholder="0.00" 
              {...register("montant", { valueAsNumber: true })}
              className="h-10"
            />
            {errors.montant && (
              <p className="text-sm text-destructive">{errors.montant.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button 
              type="submit" 
              disabled={isSubmitting || loading} 
              className="flex-1 gap-2"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Mise à jour..." : "Mettre à jour le paiement"}
            </Button>
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Annuler
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
