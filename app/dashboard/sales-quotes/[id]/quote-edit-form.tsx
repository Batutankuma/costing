"use client";

import * as React from "react";
import { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAction } from "next-safe-action/hooks";
import { updateQuote, computeBasePrices } from "../actions";
import { listBuilders } from "@/app/dashboard/builders/actions";

type Quote = {
  id: string;
  proformaNumber?: string | null;
  marginUSD?: number | null;
  freightToMineUSD?: number | null;
  description?: string | null;
  tvaApplicable?: boolean | null;
  tvaAmount?: number | null;
  totalDDUUSD?: number | null;
  totalDDPUSD?: number | null;
  client?: { id: string; name?: string | null } | null;
  costBuildUp?: { id: string; title?: string | null } | null;
};

export default function QuoteEditForm({ initial }: { initial: Quote }) {
  const { executeAsync: doUpdate, status } = useAction(updateQuote);
  const isPending = status === "executing";

  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [builders, setBuilders] = useState<Array<{ id: string; title: string }>>([]);
  const [transportRates, setTransportRates] = useState<Array<{ id: string; destination: string; rateUsdPerCbm: number }>>([]);

  const [clientId, setClientId] = useState<string>(initial.client?.id || "");
  const [builderId, setBuilderId] = useState<string>(initial.costBuildUp?.id || "");
  const [proformaNumber, setProformaNumber] = useState<string>(initial.proformaNumber || "");
  const [marginUSD, setMarginUSD] = useState<number>(Number(initial.marginUSD || 0));
  const [freightToMineUSD, setFreightToMineUSD] = useState<number>(Number(initial.freightToMineUSD || 0));
  const [tvaApplicable, setTvaApplicable] = useState<boolean>(Boolean(initial.tvaApplicable));
  const [tvaAmount, setTvaAmount] = useState<number>(Number(initial.tvaAmount || 0));
  const [description, setDescription] = useState<string>(initial.description || "");
  const [selectedTransportRateId, setSelectedTransportRateId] = useState<string>("");

  // Load lists
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/clients", { cache: "no-store" });
        if (r.ok) {
          const data = await r.json();
          setClients(Array.isArray(data) ? data.map((c: any) => ({ id: c.id, name: c.name })) : []);
        }
      } catch { setClients([]); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const res = await listBuilders();
      const items = (res as any)?.data?.result ?? [];
      setBuilders(items.map((b: any) => ({ id: b.id, title: b.title })));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/transport-rates", { cache: "no-store" });
        if (res.ok) {
          const list = await res.json();
          setTransportRates(Array.isArray(list) ? list : []);
          // Try preselect by matching current freight value
          const match = Array.isArray(list) ? list.find((t: any) => Number(t.rateUsdPerCbm) === Number(initial.freightToMineUSD || 0)) : undefined;
          if (match?.id) setSelectedTransportRateId(match.id);
        }
      } catch { setTransportRates([]); }
    })();
  }, [initial.freightToMineUSD]);

  // Recompute base prices when builder changes (display-only usage here)
  const [baseDDUUSD, setBaseDDUUSD] = useState<number>(0);
  const [baseDDPUSD, setBaseDDPUSD] = useState<number>(0);
  useEffect(() => {
    (async () => {
      if (!builderId) return;
      try {
        const r = await computeBasePrices(builderId);
        if ((r as any)?.success) {
          setBaseDDUUSD(Number((r as any).result?.baseDDUUSD || 0));
          setBaseDDPUSD(Number((r as any).result?.baseDDPUSD || 0));
        }
      } catch {}
    })();
  }, [builderId]);

  const totalDDUUSD = useMemo(() => Number(baseDDUUSD || initial.totalDDUUSD || 0) + Number(marginUSD || 0), [baseDDUUSD, initial.totalDDUUSD, marginUSD]);
  const totalDDPUSD = useMemo(() => Number(baseDDPUSD || initial.totalDDPUSD || 0) + Number(freightToMineUSD || 0), [baseDDPUSD, initial.totalDDPUSD, freightToMineUSD]);

  const onSubmit = async () => {
    await doUpdate({
      id: initial.id,
      clientId: clientId || undefined,
      marginUSD: Number(marginUSD || 0),
      freightToMineUSD: Number(freightToMineUSD || 0),
      description: description || null,
      proformaNumber: proformaNumber || null,
      tvaApplicable,
      tvaAmount: Number(tvaAmount || 0),
    } as any);
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Client</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Sélectionner un client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Cost Build Up</Label>
          <Select value={builderId} onValueChange={setBuilderId}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Sélectionner un Cost Build Up" />
            </SelectTrigger>
            <SelectContent>
              {builders.map((b) => (<SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Freight to Mine</Label>
          <Select
            value={selectedTransportRateId}
            onValueChange={(id) => {
              setSelectedTransportRateId(id);
              const rate = transportRates.find((t) => t.id === id)?.rateUsdPerCbm ?? 0;
              setFreightToMineUSD(Number(rate));
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Sélectionner un tarif" />
            </SelectTrigger>
            <SelectContent>
              {transportRates.length === 0 ? (
                <SelectItem value="no-rate" disabled>Aucun tarif</SelectItem>
              ) : (
                transportRates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.destination} — {t.rateUsdPerCbm} USD/m³
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Freight to Mine (USD)</Label>
          <Input type="number" step="0.01" value={freightToMineUSD} onChange={(e) => setFreightToMineUSD(Number(e.target.value))} />
        </div>

        <div className="space-y-2">
          <Label>Marge (USD)</Label>
          <Input type="number" step="0.01" value={marginUSD} onChange={(e) => setMarginUSD(Number(e.target.value))} />
        </div>

        <div className="space-y-2">
          <Label>N° Proforma</Label>
          <Input value={proformaNumber} onChange={(e) => setProformaNumber(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>TVA applicable</Label>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={tvaApplicable} onChange={(e) => setTvaApplicable(e.target.checked)} />
            <span className="text-sm text-muted-foreground">16%</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Montant TVA</Label>
          <Input type="number" step="0.01" value={tvaAmount} onChange={(e) => setTvaAmount(Number(e.target.value))} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Total DDU (USD)</Label>
          <Input disabled value={Number(totalDDUUSD).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} />
        </div>
        <div className="space-y-2">
          <Label>Total DDP (USD)</Label>
          <Input disabled value={Number(totalDDPUSD).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-24" />
      </div>

      <div className="flex gap-2">
        <Button onClick={onSubmit} disabled={isPending}>{isPending ? "Enregistrement..." : "Enregistrer"}</Button>
      </div>
    </div>
  );
}


