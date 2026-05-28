import prisma from "@/lib/prisma";
import Link from "next/link";
import EditForm from "./edit-form";

export default async function EditPaiementBanquePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paiement = await prisma.paiementBanque.findUnique({ 
    where: { id },
    include: {
      commande: {
        select: { reference: true, id: true }
      },
      banque: {
        select: { nom: true, id: true }
      }
    }
  });
  if (!paiement) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Paiement banque introuvable.</p>
        </div>
        <Link href="/dashboard/paiement-banque" className="inline-block">
          <span className="underline">Retour à la liste</span>
        </Link>
      </div>
    );
  }
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Modifier le paiement banque</h1>
        <Link href="/dashboard/paiement-banque" className="underline">Retour</Link>
      </div>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <EditForm id={paiement.id} initial={{
          commandeId: paiement.commandeId,
          banqueId: paiement.banqueId,
          statusPaiement: paiement.statusPaiement,
          datePaiement: paiement.datePaiement,
          montant: paiement.montant,
          description: paiement.description,
        }} />
      </div>
    </div>
  );
}
