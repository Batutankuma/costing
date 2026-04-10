"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createLicence } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Save } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CreateLicenceSchema } from "@/models/mvc";
import { useAction } from "next-safe-action/hooks";
import { findAllAction as findAllCommandes } from "@/app/dashboard/commande/actions";
import { findAllBanquesAction } from "@/app/dashboard/banque/actions";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type LicenceFormInput = z.input<typeof CreateLicenceSchema>;
type LicenceFormOutput = z.infer<typeof CreateLicenceSchema>;

type CommandeRef = {
  id: string;
  reference: string;
};

type BanqueRef = {
  id: string;
  nom: string;
};

export default function CreateLicencePage() {
  const router = useRouter();
  const { toast } = useToast();
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
    formState: { errors, isSubmitting },
  } = useForm<LicenceFormInput, unknown, LicenceFormOutput>({
    resolver: zodResolver(CreateLicenceSchema),
    defaultValues: {
      commandeId: "",
      banqueId: "",
      validiteLicence: "EN_ATTENTE",
      numeroBulletin: "",
      numeroLicenceImport: "",
      numeroLettreEngagement: "",
      statusJustification: false,
    }
  });

  const onSubmit = async (data: LicenceFormOutput) => {
    try {
      const result = await createLicence(data);
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
        description: "Licence créée avec succès !" 
      });
      router.push(`/dashboard/licence`);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Une erreur est survenue lors de l'enregistrement.";
      toast({ 
        variant: "destructive", 
        title: "Erreur", 
        description: errorMessage
      });
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/licence">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div className="h-6 w-px bg-border" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouvelle Licence</h1>
          <p className="text-muted-foreground">
            Ajoutez une nouvelle licence d'import à votre base de données
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Informations de la licence
          </CardTitle>
          <CardDescription>
            Remplissez les informations ci-dessous pour créer une nouvelle licence
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
                  Commande <span className="text-destructive">*</span>
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
                  Banque <span className="text-destructive">*</span>
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

            <div className="space-y-2">
              <Label htmlFor="validiteLicence" className="text-sm font-medium">
                Validité Licence <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="validiteLicence"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Sélectionner le statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VALIDE">Valide</SelectItem>
                      <SelectItem value="EXPIREE">Expirée</SelectItem>
                      <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                      <SelectItem value="SUSPENDUE">Suspendue</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.validiteLicence && (
                <p className="text-sm text-destructive">{errors.validiteLicence.message}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="numeroBulletin" className="text-sm font-medium">
                  N° Bulletin
                </Label>
                <Input 
                  id="numeroBulletin" 
                  placeholder="Numéro du bulletin" 
                  {...register("numeroBulletin")}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroLicenceImport" className="text-sm font-medium">
                  N° Licence Import
                </Label>
                <Input 
                  id="numeroLicenceImport" 
                  placeholder="Numéro de la licence d'import" 
                  {...register("numeroLicenceImport")}
                  className="h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroLettreEngagement" className="text-sm font-medium">
                Numéro de Lettre Engagement
              </Label>
              <Input 
                id="numeroLettreEngagement" 
                placeholder="Numéro de la lettre d'engagement" 
                {...register("numeroLettreEngagement")}
                className="h-10"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Controller
                name="statusJustification"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="statusJustification"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="statusJustification" className="text-sm font-medium cursor-pointer">
                Status de justification
              </Label>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button 
                type="submit" 
                disabled={isSubmitting || loading} 
                className="flex-1 gap-2"
              >
                <Save className="h-4 w-4" />
                {isSubmitting ? "Enregistrement..." : "Enregistrer la licence"}
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
