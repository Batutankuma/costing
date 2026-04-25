import Link from "next/link";
import { getClientOrderById } from "../../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, FileText } from "lucide-react";

export default async function ViewClientOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clientOrder = await getClientOrderById(id);

  if (!clientOrder) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Bon de commande client introuvable.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/client-orders">Retour a la liste</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/client-orders">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <FileText className="h-8 w-8 text-primary" />
                Détails du bon client: {clientOrder.reference}
              </h1>
              <p className="text-muted-foreground">Visualisation complète du bon de commande client</p>
            </div>
          </div>
          <Link href={`/dashboard/client-orders/${clientOrder.id}`}>
            <Button size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations Générales</CardTitle>
          <CardDescription>Détails du bon client</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label className="text-sm font-medium text-muted-foreground">Reference</Label><p className="text-lg font-semibold">{clientOrder.reference}</p></div>
          <div><Label className="text-sm font-medium text-muted-foreground">Date</Label><p className="text-lg">{new Date(clientOrder.date).toLocaleDateString("fr-FR")}</p></div>
          <div><Label className="text-sm font-medium text-muted-foreground">Client</Label><p className="text-lg">{clientOrder.client.company || clientOrder.client.name || "-"}</p></div>
          <div><Label className="text-sm font-medium text-muted-foreground">Produit</Label><p className="text-lg">{clientOrder.produit.name}</p></div>
          <div><Label className="text-sm font-medium text-muted-foreground">Quantite commandee</Label><p className="text-lg">{Number(clientOrder.quantity || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
          <div><Label className="text-sm font-medium text-muted-foreground">Prix unitaire</Label><p className="text-lg">{Number(clientOrder.unitPrice || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {clientOrder.devise}</p></div>
          <div><Label className="text-sm font-medium text-muted-foreground">Statut</Label><p className="text-lg">{clientOrder.status}</p></div>
          <div><Label className="text-sm font-medium text-muted-foreground">Notes</Label><p className="text-lg">{clientOrder.notes || "N/A"}</p></div>
        </CardContent>
      </Card>
    </div>
  );
}
