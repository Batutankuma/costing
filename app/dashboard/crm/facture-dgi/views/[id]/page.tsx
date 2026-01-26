import { notFound } from "next/navigation";
import FactureDgiViewClient from "./facture-dgi-view";

type PageProps = {
  params?: Promise<{ id: string }>;
};

export default async function FactureDgiViewPage({ params }: PageProps) {
  const resolved = params ? await params : null;
  if (!resolved?.id) {
    notFound();
  }
  return <FactureDgiViewClient factureDgiId={resolved.id} />;
}

