"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ClientInitial = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
};

export default function ClientEditForm({ initial }: { initial: ClientInitial }) {
  const [form, setForm] = React.useState(initial);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setIsSubmitting(true);
    try {
      const r = await fetch(`/api/clients/${initial.id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      if (r.ok) setMessage("Client modifié avec succès."); else setError("Erreur lors de la mise à jour.");
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Modifier Client</h1>
      {message && <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-600 mb-4">{message}</div>}
      {error && <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600 mb-4">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2"><Label>Nom</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="space-y-2"><Label>Société</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="space-y-2"><Label>Téléphone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="space-y-2"><Label>Adresse</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="space-y-2"><Label>Notes</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Mise à jour..." : "Mettre à jour"}</Button>
          <Button asChild variant="outline"><Link href="/dashboard/clients">Annuler</Link></Button>
        </div>
      </form>
    </div>
  );
}




