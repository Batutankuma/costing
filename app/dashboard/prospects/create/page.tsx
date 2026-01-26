"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAction } from "next-safe-action/hooks";
import { createProspect, getUsers } from "../actions";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Schema = z.object({
  name: z.string().min(1, "Nom requis"),
  company: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  stage: z.enum(["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"]),
  notes: z.string().optional().nullable(),
  // Champs de qualification
  jobTitle: z.string().optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  potentialValue: z.number().min(0).optional().nullable(),
  expectedCloseDate: z.date().optional().nullable(),
  tags: z.string().optional().nullable(), // Sera converti en array
  ownerId: z.string().optional().nullable(),
});
type FormData = z.infer<typeof Schema>;

export default function CreateProspectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: {
      stage: "NEW",
    }
  });
  const { executeAsync, status } = useAction(createProspect);
  const isPending = status === "executing";

  // Charger les utilisateurs
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersList = await getUsers();
        setUsers(usersList);
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs:", error);
      }
    };
    loadUsers();
  }, []);

  const onSubmit = async (data: FormData) => {
    try {
      // Convertir tags string en array
      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(t => t.length > 0) : [];

      const submitData = {
        ...data,
        tags: tagsArray,
        email: data.email === "" ? null : data.email,
        website: data.website === "" ? null : data.website,
      };

      const res = await executeAsync(submitData);
      if (res?.data?.success) {
        toast({ title: "Succès", description: "Prospect créé avec succès" });
        router.push("/dashboard/prospects");
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: res?.data?.failure || "Erreur lors de la création"
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue"
      });
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nouveau Prospect</h1>
            <p className="text-muted-foreground">Ajouter un nouveau prospect à votre pipeline</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Annuler
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du prospect</CardTitle>
          <CardDescription>Renseignez les coordonnées et informations principales.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input id="name" {...register("name")} />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Société</Label>
                <Input id="company" {...register("company")} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && <p className="text-red-500 text-sm">{errors.email.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" {...register("phone")} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Input id="source" {...register("source")} placeholder="Ex: Site web, Référence, etc." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stage">Étape <span className="text-red-500">*</span></Label>
                <Select
                  onValueChange={(value) => setValue("stage", value as "NEW" | "CONTACTED" | "QUALIFIED" | "WON" | "LOST")}
                  defaultValue="NEW"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une étape" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">Nouveau</SelectItem>
                    <SelectItem value="CONTACTED">Contacté</SelectItem>
                    <SelectItem value="QUALIFIED">Qualifié</SelectItem>
                    <SelectItem value="WON">Gagné</SelectItem>
                    <SelectItem value="LOST">Perdu</SelectItem>
                  </SelectContent>
                </Select>
                {errors.stage && <p className="text-red-500 text-sm">{errors.stage.message as string}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerId">Propriétaire</Label>
              <Select onValueChange={(value) => setValue("ownerId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un propriétaire (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" {...register("notes")} placeholder="Notes supplémentaires sur le prospect" rows={4} />
            </div>

            {/* Section Qualification */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Informations de Qualification</h3>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Poste</Label>
                  <Input id="jobTitle" {...register("jobTitle")} placeholder="Ex: Directeur Commercial" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Site web</Label>
                  <Input id="website" type="url" {...register("website")} placeholder="https://example.com" />
                  {errors.website && <p className="text-red-500 text-sm">{errors.website.message as string}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input id="address" {...register("address")} placeholder="Adresse complète" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville</Label>
                  <Input id="city" {...register("city")} placeholder="Ville" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Pays</Label>
                  <Input id="country" {...register("country")} placeholder="Pays" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="potentialValue">Valeur potentielle (USD)</Label>
                  <Input
                    id="potentialValue"
                    type="number"
                    step="0.01"
                    {...register("potentialValue", { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  {errors.potentialValue && <p className="text-red-500 text-sm">{errors.potentialValue.message as string}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedCloseDate">Date de clôture prévue</Label>
                  <Input
                    id="expectedCloseDate"
                    type="date"
                    {...register("expectedCloseDate", { valueAsDate: true })}
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
                <Input id="tags" {...register("tags")} placeholder="Ex: important, vip, suivi" />
                <p className="text-xs text-muted-foreground">Séparez les tags par des virgules</p>
              </div>
            </div>

            <div className="flex gap-4 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Création..." : "Créer le prospect"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


