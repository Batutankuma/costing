import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Truck } from "lucide-react";
import { getTransporteurById } from "../actions";
import EditTransporteurForm from "./edit-form";

export default async function EditTransporteurPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const transporteur = await getTransporteurById(id);

  if (!transporteur) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Transporteur introuvable.</p>
        </div>
        <Link href="/dashboard/transport" className="inline-block underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/transport">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div className="h-6 w-px bg-border" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="h-8 w-8 text-primary" />
            Modifier le transporteur
          </h1>
          <p className="text-muted-foreground">Mettez à jour les informations</p>
        </div>
      </div>

      <EditTransporteurForm
        id={transporteur.id}
        initial={{
          nom: transporteur.nom,
          description: transporteur.description ?? "",
          adresse: transporteur.adresse ?? "",
          contactTelephone: transporteur.contactTelephone ?? "",
          mail: transporteur.mail ?? "",
        }}
      />
    </div>
  );
}
