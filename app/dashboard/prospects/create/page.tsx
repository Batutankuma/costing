"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAction } from "next-safe-action/hooks";
import { createProspect } from "../actions";
import { useRouter } from "next/navigation";

const Schema = z.object({
  name: z.string().min(1, "Nom requis"),
  company: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  stage: z.enum(["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"]).default("NEW"),
  notes: z.string().optional().nullable(),
});
type FormData = z.infer<typeof Schema>;

export default function CreateProspectPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(Schema) });
  const { executeAsync, status } = useAction(createProspect);
  const isPending = status === "executing";

  const onSubmit = async (data: FormData) => {
    const res = await executeAsync(data);
    if (res.data?.success) router.push("/dashboard/prospects");
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
                <Input id="source" {...register("source")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stage">Étape</Label>
                <Input id="stage" placeholder="NEW | CONTACTED | QUALIFIED | WON | LOST" {...register("stage")} />
                {errors.stage && <p className="text-red-500 text-sm">{errors.stage.message as string}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" {...register("notes")} />
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


