import prisma from "@/lib/prisma";
import Link from "next/link";
import EditForm from "./edit-form";

export default async function EditFournisseurPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fournisseur = await prisma.fournisseur.findUnique({ where: { id } });
  if (!fournisseur) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Fournisseur introuvable.</p>
        </div>
        <Link href="/dashboard/crm/fournisseur" className="inline-block">
          <span className="underline">Retour à la liste</span>
        </Link>
      </div>
    );
  }
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Modifier le fournisseur</h1>
        <Link href="/dashboard/crm/fournisseur" className="underline">Retour</Link>
      </div>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <EditForm 
          id={fournisseur.id} 
          initial={{ 
            nom: fournisseur.nom, 
            company: fournisseur.company,
            email: fournisseur.email,
            phone: fournisseur.phone,
            adresse: fournisseur.adresse, 
            rccm: fournisseur.rccm,
            idNat: fournisseur.idNat,
            nif: fournisseur.nif,
            pays: fournisseur.pays,
            notes: fournisseur.notes,
          }} 
        />
      </div>
    </div>
  );
}