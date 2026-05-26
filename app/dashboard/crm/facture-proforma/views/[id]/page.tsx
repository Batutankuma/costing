import { notFound } from "next/navigation";
import FactureViewClient from "@/app/dashboard/crm/facture/views/[id]/facture-view-client";
import { MANUAL_FACTURE_CONFIG } from "@/lib/manual-facture-config";
import { findFactureById } from "../../actions";

type PageProps = {
  params?: Promise<{ id: string }>;
};

export default async function FactureProformaViewPage({ params }: PageProps) {
  const resolved = params ? await params : null;
  if (!resolved?.id) {
    notFound();
  }
  return (
    <FactureViewClient
      factureId={resolved.id}
      config={MANUAL_FACTURE_CONFIG.PROFORMA}
      findFactureById={findFactureById}
    />
  );
}
