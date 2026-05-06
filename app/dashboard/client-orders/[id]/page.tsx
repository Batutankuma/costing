import { getClientOrderById } from "../actions";
import EditClientOrderForm from "./user-edit-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

export default async function EditClientOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clientOrder = await getClientOrderById(id);

  if (!clientOrder) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Bon de commande client introuvable.</p>
        </div>
        <Link href="/dashboard/client-orders" className="inline-block">
          <span className="underline">Retour a la liste</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/client-orders">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div className="h-6 w-px bg-border" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Modifier le bon client
          </h1>
          <p className="text-muted-foreground">Mettez a jour les informations du bon client.</p>
        </div>
      </div>
      <EditClientOrderForm
        id={clientOrder.id}
        initial={{
          reference: clientOrder.reference,
          date: clientOrder.date,
          status: clientOrder.status,
          clientId: clientOrder.clientId,
          produitId: clientOrder.produitId,
          quantity: Number(clientOrder.quantity || 0),
          unitPrice: Number(clientOrder.unitPrice || 0),
          devise: clientOrder.devise as "USD" | "CDF" | "EUR" | "XOF",
          notes: clientOrder.notes || "",
        }}
      />
    </div>
  );
}
