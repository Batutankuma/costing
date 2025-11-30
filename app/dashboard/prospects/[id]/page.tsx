"use client";

import prisma from "@/lib/prisma";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAction } from "next-safe-action/hooks";
import { updateProspect } from "../actions";
import { z } from "zod";

const Schema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nom requis"),
  company: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  stage: z.enum(["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"]),
  notes: z.string().optional().nullable(),
});
type FormData = z.infer<typeof Schema>;

export default function EditProspectPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { executeAsync, status } = useAction(updateProspect);
  const isPending = status === "executing";

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({ resolver: zodResolver(Schema) });

  useEffect(() => {
    async function load() {
      try {
        const id = params.id as string;
        const prospect = await (prisma as any).prospect.findUnique({ where: { id } });
        if (!prospect) {
          toast({ variant: "destructive", title: "Erreur", description: "Prospect introuvable." });
          router.push("/dashboard/prospects");
          return;
        }
        reset({
          id: prospect.id,
          name: prospect.name,
          company: prospect.company ?? null,
          email: prospect.email ?? null,
          phone: prospect.phone ?? null,
          source: prospect.source ?? null,
          stage: prospect.stage ?? "NEW",
          notes: prospect.notes ?? null,
        });
      } catch (e) {
        toast({ variant: "destructive", title: "Erreur", description: "Chargement impossible." });
        router.push("/dashboard/prospects");
      }
    }
    if (params.id) load();
  }, [params.id, reset, router, toast]);

  const onSubmit = async (data: FormData) => {
    const res = await executeAsync(data as any);
    if (!(res as any)?.data?.success) {
      toast({ variant: "destructive", title: "Erreur", description: (res as any)?.data?.failure || "Mise à jour échouée" });
      return;
    }
    toast({ title: "Succès", description: "Prospect modifié." });
    router.push("/dashboard/prospects");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Modifier Prospect</h1>
            <p className="text-muted-foreground">Édition des informations prospect</p>
          </div>
          <Button type="button" variant="outline" onClick={() => router.push("/dashboard/prospects")}>Annuler</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du prospect</CardTitle>
          <CardDescription>Mettez à jour les informations du prospect.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
            <input type="hidden" {...register("id")} />
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
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" {...register("notes")} />
            </div>

            <div className="flex gap-4 justify-end pt-4">
              <Button type="submit" disabled={isPending}>{isPending ? "Mise à jour..." : "Mettre à jour"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


