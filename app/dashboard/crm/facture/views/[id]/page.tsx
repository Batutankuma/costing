import { notFound } from "next/navigation";
import FactureViewClient from "./facture-view-client";

type PageProps = {
  params?: Promise<{ id: string }>;
};

export default async function FactureViewPage({ params }: PageProps) {
  const resolved = params ? await params : null;
  if (!resolved?.id) {
    notFound();
  }
  return <FactureViewClient factureId={resolved.id} />;
}
