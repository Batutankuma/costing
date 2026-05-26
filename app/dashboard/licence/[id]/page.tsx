import prisma from "@/lib/prisma";
import Link from "next/link";
import EditForm from "./edit-form";

export default async function EditLicencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const licence = await prisma.licence.findUnique({ 
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
  if (!licence) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Licence introuvable.</p>
        </div>
        <Link href="/dashboard/licence" className="inline-block">
          <span className="underline">Retour à la liste</span>
        </Link>
      </div>
    );
  }
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Modifier la licence</h1>
        <Link href="/dashboard/licence" className="underline">Retour</Link>
      </div>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <EditForm id={licence.id} initial={{
          commandeId: licence.commandeId,
          banqueId: licence.banqueId,
          validiteLicence: licence.validiteLicence,
          numeroBulletin: licence.numeroBulletin ?? "",
          numeroLicenceImport: licence.numeroLicenceImport ?? "",
          numeroLettreEngagement: licence.numeroLettreEngagement ?? "",
          statusJustification: licence.statusJustification,
          dateJustification: licence.dateJustification,
          description: licence.description,
        }} />
      </div>
    </div>
  );
}
