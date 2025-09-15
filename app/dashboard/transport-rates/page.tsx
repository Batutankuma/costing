"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type TransportRate = { id?: string; destination: string; rateUsdPerCbm: number };

const initialRates: TransportRate[] = [
  { destination: "Likasi (before peage)", rateUsdPerCbm: 50 },
  { destination: "Likasi (after peage)", rateUsdPerCbm: 55 },
  { destination: "Kambove", rateUsdPerCbm: 65 },
  { destination: "kolwezi", rateUsdPerCbm: 75 },
  { destination: "Mokambo", rateUsdPerCbm: 65 },
  { destination: "Komoah", rateUsdPerCbm: 95 },
  { destination: "Fungurme", rateUsdPerCbm: 60 },
  { destination: "Luwisha", rateUsdPerCbm: 35 },
  { destination: "Lopoto", rateUsdPerCbm: 35 },
  { destination: "Kisanda", rateUsdPerCbm: 45 },
  { destination: "Kisamfu", rateUsdPerCbm: 65 },
  { destination: "kipoi", rateUsdPerCbm: 40 },
  { destination: "Kawama", rateUsdPerCbm: 15 },
  { destination: "Lubumbashi", rateUsdPerCbm: 15 },
  { destination: "Kibolve", rateUsdPerCbm: 65 },
];

export default function TransportRatesPage() {
  const [rows, setRows] = useState<TransportRate[]>(initialRates);

  const [destination, setDestination] = useState("");
  const [rate, setRate] = useState<number | "">("");

  const saveLocal = (next: TransportRate[]) => setRows(next);

  // Load from API
  useMemo(() => {
    (async () => {
      try {
        const res = await fetch("/api/transport-rates", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length) setRows(data);
        }
      } catch {}
    })();
  }, []);

  const addRow = async () => {
    if (!destination || rate === "") return;
    try {
      const res = await fetch("/api/transport-rates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ destination, rateUsdPerCbm: Number(rate) }) });
      const created = await res.json();
      saveLocal([...rows, created]);
    } catch {
      saveLocal([...rows, { destination, rateUsdPerCbm: Number(rate) }]);
    }
    setDestination("");
    setRate("");
  };

  const totals = useMemo(() => ({ count: rows.length, avg: rows.reduce((a, b) => a + b.rateUsdPerCbm, 0) / (rows.length || 1) }), [rows]);

  const updateRow = async (idx: number, changes: Partial<TransportRate>) => {
    const current = rows[idx];
    const next = { ...current, ...changes } as TransportRate;
    setRows(rows.map((r, i) => (i === idx ? next : r)));
    try {
      if (current.id) {
        await fetch(`/api/transport-rates/${current.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ destination: next.destination, rateUsdPerCbm: next.rateUsdPerCbm }),
        });
      }
    } catch {}
  };

  const deleteRow = async (idx: number) => {
    const current = rows[idx];
    setRows(rows.filter((_, i) => i !== idx));
    try {
      if (current.id) {
        await fetch(`/api/transport-rates/${current.id}`, { method: "DELETE" });
      }
    } catch {}
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Transport Rates</CardTitle>
          <CardDescription>Rates (USD / cbm) by destination</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="dest">Destination</Label>
              <Input id="dest" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Ex: Likasi (before peage)" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Rate (USD / cbm)</Label>
              <Input id="rate" type="number" step="any" value={rate} onChange={(e) => setRate(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0" />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button onClick={addRow}>Add</Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Destination</TableHead>
                <TableHead className="text-right">Rate (USD / cbm)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={r.id ?? `${r.destination}-${i}`}>
                  <TableCell className="font-medium">
                    <Input value={r.destination} onChange={(e) => updateRow(i, { destination: e.target.value })} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input className="text-right" type="number" step="any" value={r.rateUsdPerCbm} onChange={(e) => updateRow(i, { rateUsdPerCbm: e.target.value === "" ? 0 : Number(e.target.value) })} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="destructive" onClick={() => deleteRow(i)}>Supprimer</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="text-sm text-muted-foreground flex justify-between">
            <span>Total destinations: {totals.count}</span>
            <span>Average rate: {totals.avg.toLocaleString("fr-FR", { style: "currency", currency: "USD", minimumFractionDigits: 0 })}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


