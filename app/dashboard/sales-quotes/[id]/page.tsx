import { getQuoteById } from "../actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import QuoteEditForm from "./quote-edit-form";

interface Props { params: Promise<{ id: string }> }

export default async function QuoteDetailPage({ params }: Props) {
  const { id } = await params;
  const res = await getQuoteById({ id });
  const q = (res as any)?.data?.result;

  if (!q) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Modifier Devis</h1>
              <p className="text-muted-foreground">Édition d'un devis commercial</p>
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
    </div>
  );
}


