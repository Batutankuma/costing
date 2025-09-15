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
import { createClient } from "../actions";
import { useRouter } from "next/navigation";

const Schema = z.object({
  name: z.string().min(1, "Nom requis"),
  company: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof Schema>;

export default function CreateClientPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(Schema) });
  const { executeAsync, status } = useAction(createClient);
  const isPending = status === "executing";

  const onSubmit = async (data: FormData) => {
    const res = await executeAsync(data as any);
    if ((res as any)?.data?.success) router.push("/dashboard/clients");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Nouveau Client</h1>
        <p className="text-muted-foreground">Créer un client</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du client</CardTitle>
          <CardDescription>Renseignez les coordonnées et informations principales.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nom</Label>
                <Input {...register("name")} />
                {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
              </div>
              <div>
                <Label>Société</Label>
                <Input {...register("company")} />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input type="email" {...register("email")} />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input {...register("phone")} />
              </div>
            </div>
            <div>
              <Label>Adresse</Label>
              <Input {...register("address")} />
            </div>
            <div>
              <Label>Notes</Label>
              <Input {...register("notes")} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => router.back()}>Annuler</Button>
              <Button type="submit" disabled={isPending}>{isPending ? "Création..." : "Créer"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


