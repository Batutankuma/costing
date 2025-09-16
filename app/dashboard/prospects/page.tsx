"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Prospect = {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  stage: "NEW" | "CONTACTED" | "QUALIFIED" | "WON" | "LOST";
  notes?: string | null;
};

const STAGES: Prospect["stage"][] = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"];

export default function ProspectsPage() {
  const [items, setItems] = useState<Prospect[]>([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Prospect>>({ stage: "NEW" });

  const load = async () => {
    const r = await fetch("/api/prospects", { cache: "no-store" });
    setItems(r.ok ? await r.json() : []);
  };

  useEffect(() => { load(); }, []);

  const onCreate = async () => {
    setCreating(true);
    try {
      const r = await fetch("/api/prospects", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      if (r.ok) { setForm({ stage: "NEW" }); await load(); }
    } finally { setCreating(false); }
  };

  const onUpdate = async (id: string, patch: Partial<Prospect>) => {
    const r = await fetch(`/api/prospects/${id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) });
    if (r.ok) await load();
  };

  const onDelete = async (id: string) => {
    const r = await fetch(`/api/prospects/${id}`, { method: "DELETE" });
    if (r.ok) await load();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Prospects</h1>

      <div className="grid md:grid-cols-6 gap-3 items-end">
        <div className="md:col-span-2"><Label>Nom</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Société</Label><Input value={form.company ?? ""} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
        <div><Label>Email</Label><Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div><Label>Téléphone</Label><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div><Label>Source</Label><Input value={form.source ?? ""} onChange={(e) => setForm({ ...form, source: e.target.value })} /></div>
        <div>
          <Label>Étape</Label>
          <Select value={form.stage as any} onValueChange={(v) => setForm({ ...form, stage: v as any })}>
            <SelectTrigger><SelectValue placeholder="Étape" /></SelectTrigger>
            <SelectContent>
              {STAGES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-6"><Label>Notes</Label><Input value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        <div><Button disabled={creating || !form.name} onClick={onCreate}>{creating ? "Ajout..." : "Ajouter"}</Button></div>
      </div>

      <div className="mt-6 divide-y rounded-lg border">
        {items.map((p) => (
          <div key={p.id} className="grid md:grid-cols-6 gap-3 p-3 items-center">
            <Input value={p.name} onChange={(e) => onUpdate(p.id, { name: e.target.value })} />
            <Input value={p.company ?? ""} onChange={(e) => onUpdate(p.id, { company: e.target.value })} />
            <Input type="email" value={p.email ?? ""} onChange={(e) => onUpdate(p.id, { email: e.target.value })} />
            <Input value={p.phone ?? ""} onChange={(e) => onUpdate(p.id, { phone: e.target.value })} />
            <Select value={p.stage} onValueChange={(v) => onUpdate(p.id, { stage: v as any })}>
              <SelectTrigger><SelectValue placeholder="Étape" /></SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="destructive" onClick={() => onDelete(p.id)}>Supprimer</Button>
            </div>
            <div className="md:col-span-6 -mt-2">
              <Input value={p.notes ?? ""} onChange={(e) => onUpdate(p.id, { notes: e.target.value })} placeholder="Notes" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}







