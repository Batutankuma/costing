"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAction } from "next-safe-action/hooks";
import { updatePriceReference } from "../actions";

export default function PriceEditForm({ initial }: { initial: any }) {
  const [pmfUSD, setPmfUSD] = React.useState<number>(initial.pmfCommercialUSD);
  const [socComFee, setSocComFee] = React.useState<number>(initial.commercialCosts?.socComFee ?? 0);
  const [warehouseFee, setWarehouseFee] = React.useState<number>(initial.logisticsCosts?.warehouseFee ?? 0);
  const [total2, setTotal2] = React.useState<number>(initial.fiscality?.total2 ?? 0);
  const { executeAsync, status } = useAction(updatePriceReference);
  const isSubmitting = status === "executing";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeAsync({
      id: initial.id,
      pmfCommercialUSD: pmfUSD,
      commercial: { socComFee },
      logistics: { warehouseFee },
      fiscality: { total2 },
    } as any);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Modifier structure</h1>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>PMF (USD)</Label>
            <Input type="number" step="0.01" value={pmfUSD} onChange={(e) => setPmfUSD(Number(e.target.value))} />
          </div>
          <div>
            <Label>Entrepôt (CDF)</Label>
            <Input type="number" step="0.01" value={warehouseFee} onChange={(e) => setWarehouseFee(Number(e.target.value))} />
          </div>
          <div>
            <Label>SOC. Com. (CDF)</Label>
            <Input type="number" step="0.01" value={socComFee} onChange={(e) => setSocComFee(Number(e.target.value))} />
          </div>
          <div>
            <Label>Total Fiscalité 2 (CDF)</Label>
            <Input type="number" step="0.01" value={total2} onChange={(e) => setTotal2(Number(e.target.value))} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Mise à jour..." : "Mettre à jour"}</Button>
        </div>
      </form>
    </div>
  );
}


