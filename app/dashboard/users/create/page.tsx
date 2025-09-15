"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreateUserSchema } from "@/models/mvc.pruned";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAction } from "next-safe-action/hooks";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { adminCreateWithPasswordAction } from "../actions";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Utiliser le type d'entrée du schéma (avant defaults) pour correspondre au resolver
type UserFormData = z.input<typeof CreateUserSchema>;

export default function CreateUserPage() {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<UserFormData>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: { name: "", email: "", emailVerified: false, role: "COMMERCIAL" },
  });

  const [passwordModal, setPasswordModal] = React.useState<{ open: boolean; value: string | null }>({ open: false, value: null });

  const router = useRouter();
  const toast = ({ title, description, variant }: { title: string; description?: string; variant?: string }) =>
    console.log("toast:", title, description, variant);
  const { executeAsync, status: actionStatus } = useAction(adminCreateWithPasswordAction);
  const isPending = actionStatus === "executing";

  const onSubmit = async (data: UserFormData) => {
    try {
      const result = await executeAsync(data as any);
      if (result?.data?.success) {
        const generated = (result.data.success as any).password;
        if (generated) {
          try { await navigator.clipboard.writeText(generated); } catch {}
          setPasswordModal({ open: true, value: generated });
        } else {
          router.push(`/dashboard/users`);
        }
      } else if (result?.data?.failure) {
        console.log("toast:", { variant: "destructive", title: "Erreur", description: result.data.failure });
      } else {
        console.log("toast:", { variant: "destructive", title: "Erreur", description: "Une erreur inconnue est survenue lors de l'enregistrement." });
      }
    } catch (e: any) {
      console.error("Erreur lors de la soumission du formulaire:", e);
      console.log("toast:", { variant: "destructive", title: "Erreur Système", description: e.message || "Une erreur inattendue est survenue." });
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Créer un Nouvel Utilisateur</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="name">Nom <span className="text-red-500">*</span></Label>
          <Input id="name" placeholder="Nom" {...register("name")} />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
          <Input id="email" type="email" placeholder="email@exemple.com" {...register("email")} />
          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
        </div>
        
        <div>
          <Label>Rôle <span className="text-red-500">*</span></Label>
          <Select value={watch("role") as any} onValueChange={(v: any) => setValue("role" as any, v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionner un rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="COMMERCIAL">Commercial</SelectItem>
            </SelectContent>
          </Select>
          {(errors as any).role && <p className="text-red-500 text-sm">{(errors as any).role?.message as string}</p>}
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="emailVerified">Email vérifié</Label>
          <input id="emailVerified" type="checkbox" {...register("emailVerified")} />
        </div>
        
        <Button type="submit" disabled={isPending}>{isPending ? "Enregistrement..." : "Enregistrer l'utilisateur"}</Button>
      </form>

      <Dialog open={passwordModal.open} onOpenChange={(o) => setPasswordModal((s) => ({ ...s, open: o }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mot de passe généré</DialogTitle>
            <DialogDescription>Partagez ce mot de passe avec l'utilisateur. Il pourra le changer après connexion.</DialogDescription>
          </DialogHeader>
          <div className="rounded-md border p-3 font-mono text-sm select-all">
            {passwordModal.value}
          </div>
          <DialogFooter>
            <div className="flex gap-2">
              <Button type="button" onClick={async () => { if (passwordModal.value) { try { await navigator.clipboard.writeText(passwordModal.value); } catch {} } }}>Copier</Button>
              <Button type="button" onClick={() => { setPasswordModal({ open: false, value: null }); router.push(`/dashboard/users`); }}>Fermer</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


