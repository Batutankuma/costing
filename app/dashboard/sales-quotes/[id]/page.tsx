import { getQuoteById } from "../actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import QuoteEditForm from "./quote-edit-form";
import PrintClient from "./print-client";

interface Props { params: Promise<{ id: string }> }

type QuoteWithRelations = {
  id: string;
  createdAt: Date | string;
  proformaNumber?: string | null;
  marginUSD?: number | null;
  freightToMineUSD?: number | null;
  description?: string | null;
  tvaApplicable?: boolean | null;
  tvaAmount?: number | null;
  totalDDUUSD?: number | null;
  totalDDPUSD?: number | null;
  client?: { id: string; name: string; address?: string | null; rccm?: string | null; idNat?: string | null; nif?: string | null } | null;
  costBuildUp?: {
    id: string;
    title: string;
    totals?: { priceDDUUSD?: number | null; priceDDPUSD?: number | null } | null;
    transport?: { freightToMineUSD?: number | null } | null;
    supplierDDU?: { supplierMarginUSD?: number | null } | null;
  } | null;
};

export default async function QuoteDetailPage({ params }: Props) {
  const { id } = await params;
  const res = await getQuoteById({ id });
  const q = res.data?.success ? res.data.result : null;

  if (!q) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Modifier Devis</h1>
              <p className="text-muted-foreground">Édition d&apos;un devis commercial</p>
            </div>
          </div>
        </div>
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Devis introuvable.</p>
        </div>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/dashboard/sales-quotes">Retour</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Modifier Devis</h1>
            <p className="text-muted-foreground">Édition du devis #{q.proformaNumber || "—"}</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/sales-quotes">Annuler</Link>
          </Button>
        </div>
      </div>

      {/* Vue récapitulative (lecture seule) */}
      <div className="grid gap-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-lg p-4">
          <div>
            <div className="text-xs text-muted-foreground">N° Proforma</div>
            <div className="font-medium">{q.proformaNumber || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Date</div>
            <div className="font-medium">{q.createdAt ? new Date(q.createdAt).toLocaleDateString("fr-FR") : "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Client</div>
            <div className="font-medium">{q.client?.name || "—"}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Cost Build Up</div>
            <div className="font-medium">{q.costBuildUp?.title || "—"}</div>
          </div>
        </div>

        {(() => {
          const totals = q.costBuildUp?.totals;
          const supplier = q.costBuildUp?.supplierDDU;
          const transport = q.costBuildUp?.transport;
          const baseDDUUSD = Math.max(0, Number(totals?.priceDDUUSD || 0) - Number(supplier?.supplierMarginUSD || 0));
          const baseDDPUSD = Math.max(0, Number(totals?.priceDDPUSD || 0) - Number(transport?.freightToMineUSD || 0));
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-lg p-4">
              <div>
                <div className="text-xs text-muted-foreground">DDU (base, hors marge)</div>
                <div className="font-medium">{baseDDUUSD.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">DDP (base, hors freight)</div>
                <div className="font-medium">{baseDDPUSD.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Marge (USD)</div>
                <div className="font-medium">{Number(q.marginUSD || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Freight to Mine (USD)</div>
                <div className="font-medium">{Number(q.freightToMineUSD || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total DDU (USD)</div>
                <div className="font-semibold text-emerald-700">{Number(q.totalDDUUSD || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Total DDP (USD)</div>
                <div className="font-semibold text-sky-700">{Number(q.totalDDPUSD || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">TVA applicable</div>
                <div className="font-medium">{q.tvaApplicable ? "Oui (16%)" : "Non"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Montant TVA</div>
                <div className="font-medium">{Number(q.tvaAmount || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs text-muted-foreground">Description</div>
                <div className="font-medium whitespace-pre-wrap">{q.description || "—"}</div>
              </div>
            </div>
          );
        })()}
      </div>

      <QuoteEditForm initial={{
        id: q.id,
        proformaNumber: q.proformaNumber,
        marginUSD: q.marginUSD,
        freightToMineUSD: q.freightToMineUSD,
        description: q.description,
        tvaApplicable: q.tvaApplicable,
        tvaAmount: q.tvaAmount,
        totalDDUUSD: q.totalDDUUSD,
        totalDDPUSD: q.totalDDPUSD,
        client: q.client ? { id: q.client.id, name: q.client.name } : null,
        costBuildUp: q.costBuildUp ? { id: q.costBuildUp.id, title: q.costBuildUp.title } : null,
      }} />

      <div className="mt-10">
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Réimpression</h2>
          <p className="text-sm text-muted-foreground">Réimprimer ce devis avec les mêmes informations sauvegardées.</p>
        </div>
        <PrintClient
          proformaNumber={q.proformaNumber}
          clientName={q.client?.name}
          clientAddress={q.client?.address}
          clientRccm={q.client?.rccm}
          clientIdNat={q.client?.idNat}
          clientNif={q.client?.nif}
          totalDDUUSD={q.totalDDUUSD}
          totalDDPUSD={q.totalDDPUSD}
          tvaApplicable={q.tvaApplicable}
        />
      </div>
    </div>
  );
}


