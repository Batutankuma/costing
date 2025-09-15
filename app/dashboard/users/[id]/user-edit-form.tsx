"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAction } from "next-safe-action/hooks";
import { updateAction, adminResetPasswordAction } from "../actions";

type UserInitial = {
  id: string;
  name: string;
  email: string;
  image: string;
  emailVerified: boolean;
  role?: "ADMIN" | "COMMERCIAL";
};

export default function UserEditForm({ initial }: { initial: UserInitial }) {
  const [name, setName] = React.useState(initial.name);
  const [email, setEmail] = React.useState(initial.email);
  const [image, setImage] = React.useState(initial.image);
  const [emailVerified, setEmailVerified] = React.useState(initial.emailVerified);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const { executeAsync, status } = useAction(updateAction);
  const { executeAsync: execReset, status: resetStatus } = useAction(adminResetPasswordAction);
  const isSubmitting = status === "executing";
  const [role, setRole] = React.useState<UserInitial["role"]>(initial.role ?? "COMMERCIAL");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const result = await executeAsync({ id: initial.id, name, email, image, emailVerified, role });
    if (result?.data?.success) {
      setMessage("Utilisateur modifié avec succès.");
    } else {
      setError(result?.data?.failure || "Erreur lors de la mise à jour.");
    }
  };

  const onResetPassword = async () => {
    setMessage(null);
    setError(null);
    const result = await execReset({ id: initial.id });
    if (result?.data?.success) {
      const pwd = (result.data.success as any).password as string;
      setMessage(`Nouveau mot de passe: ${pwd}`);
      try { await navigator.clipboard.writeText(pwd); } catch {}
    } else {
      setError(result?.data?.failure || "Réinitialisation échouée.");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Modifier Utilisateur</h1>
      {message && (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-600 mb-4">{message}</div>
      )}
      {error && (
        <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600 mb-4">{error}</div>
      )}
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom <span className="text-red-500">*</span></Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" type="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">Avatar (URL)</Label>
            <Input id="image" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="emailVerified">Email vérifié</Label>
            <input id="emailVerified" type="checkbox" checked={emailVerified} onChange={(e) => setEmailVerified(e.target.checked)} />
          </div>
          <div className="space-y-2">
            <Label>Rôle</Label>
            <Select value={role} onValueChange={(v) => setRole(v as any)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="COMMERCIAL">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
          
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Mise à jour..." : "Mettre à jour"}</Button>
          <Button type="button" variant="secondary" onClick={onResetPassword} disabled={resetStatus === "executing"}>
            {resetStatus === "executing" ? "Réinitialisation..." : "Réinitialiser mot de passe"}
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/users">Annuler</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}


