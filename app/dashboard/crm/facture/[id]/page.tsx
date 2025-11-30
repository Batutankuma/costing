import { notFound } from "next/navigation";
import EditFactureClient from "./edit-facture-client";

type PageProps = {
  params?: Promise<{ id: string }>;
};

export default async function EditFacturePage({ params }: PageProps) {
  const resolved = params ? await params : null;
  if (!resolved?.id) {
    notFound();
  }
  return <EditFactureClient factureId={resolved.id} />;
}
