import prisma from "@/lib/prisma";
import Link from "next/link";
import EditForm from "./edit-form";

export default async function EditBanquePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const banque = await prisma.banque.findUnique({ where: { id } });
  if (!banque) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Banque introuvable.</p>
        </div>
        <Link href="/dashboard/banque" className="inline-block">
          <span className="underline">Retour à la liste</span>
        </Link>
      </div>
    );
  }
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Modifier la banque</h1>
        <Link href="/dashboard/banque" className="underline">Retour</Link>
      </div>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <EditForm id={banque.id} initial={{ 
          nom: banque.nom, 
          numeroCompte: banque.numeroCompte,
          devise: banque.devise,
          swift: banque.swift ?? "",
          nomGestionnaire: banque.nomGestionnaire ?? "",
          mailGestionnaire: banque.mailGestionnaire ?? "",
          contactGestionnaire: banque.contactGestionnaire ?? "",
        }} />
      </div>
    </div>
  );
}
