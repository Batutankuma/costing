import { getQuoteById, updateQuote, deleteQuote } from "../actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props { params: Promise<{ id: string }> }

export default async function QuoteDetailPage({ params }: Props) {
  const { id } = await params;
  const res = await getQuoteById({ id });
  const q = (res as any)?.data?.result;

  if (!q) return <div className="p-6">Introuvable</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Devis #{q.proformaNumber || "—"}</h1>
        <div className="flex gap-2">
          <Link href={`/dashboard/sales-quotes`} className="underline">Retour</Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-muted-foreground">Auteur</div>
          <div>{q.user?.name || "—"}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Client</div>
          <div>{q.client?.name || "—"}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Total DDU</div>
          <div>{Number(q.totalDDUUSD || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} USD</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Total DDP</div>
          <div>{Number(q.totalDDPUSD || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} USD</div>
        </div>
      </div>

      <form action={async (formData) => {
        'use server';
        const marginUSD = Number(formData.get('marginUSD') || 0);
        const freightToMineUSD = Number(formData.get('freightToMineUSD') || 0);
        const description = String(formData.get('description') || '') || null;
        const proformaNumber = String(formData.get('proformaNumber') || '') || null;
        const tvaApplicable = formData.get('tvaApplicable') === 'on';
        const tvaAmount = Number(formData.get('tvaAmount') || 0);
        await updateQuote({ id, marginUSD, freightToMineUSD, description, proformaNumber, tvaApplicable, tvaAmount } as any);
      }} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm">N° Proforma</label>
            <input name="proformaNumber" defaultValue={q.proformaNumber || ''} className="w-full h-9 border rounded px-2" />
          </div>
          <div>
            <label className="text-sm">Marge (USD)</label>
            <input name="marginUSD" type="number" step="0.01" defaultValue={q.marginUSD} className="w-full h-9 border rounded px-2" />
          </div>
          <div>
            <label className="text-sm">Freight to Mine (USD)</label>
            <input name="freightToMineUSD" type="number" step="0.01" defaultValue={q.freightToMineUSD} className="w-full h-9 border rounded px-2" />
          </div>
          <div className="flex items-center gap-2">
            <input name="tvaApplicable" type="checkbox" defaultChecked={q.tvaApplicable} />
            <label className="text-sm">TVA applicable</label>
          </div>
          <div>
            <label className="text-sm">Montant TVA</label>
            <input name="tvaAmount" type="number" step="0.01" defaultValue={q.tvaAmount || 0} className="w-full h-9 border rounded px-2" />
          </div>
        </div>
        <div>
          <label className="text-sm">Description</label>
          <textarea name="description" defaultValue={q.description || ''} className="w-full min-h-24 border rounded p-2" />
        </div>
        <div className="flex gap-2">
          <Button type="submit">Enregistrer</Button>
          <form action={async () => { 'use server'; await deleteQuote({ id }); }}>
            <Button type="submit" variant="destructive">Supprimer</Button>
          </form>
        </div>
      </form>
    </div>
  );
}


