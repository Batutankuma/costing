import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function ViewPaiementBanquePage({ params }: { params: Promise<{ id: string }> }) {
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
        <Button variant="outline" asChild>
          <Link href="/dashboard/paiement-banque">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    PAYE: "Payé",
    PARTIEL: "Partiel",
    ANNULE: "Annulé",
    EN_ATTENTE: "En attente",
  };

  const statusVariants: Record<string, "default" | "destructive" | "secondary"> = {
    PAYE: "default",
    PARTIEL: "secondary",
    ANNULE: "destructive",
    EN_ATTENTE: "secondary",
  };

  return (
    <div className="p-6">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Détails du Paiement Banque</CardTitle>
          <CardDescription>Informations détaillées sur le paiement à la banque.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <Label htmlFor="commande">Bon de Commande</Label>
              <p id="commande" className="text-lg font-semibold">{paiement.commande?.reference || "N/A"}</p>
            </div>
            <div>
              <Label htmlFor="banque">Banque Réceptrice</Label>
              <p id="banque" className="text-lg">{paiement.banque?.nom || "N/A"}</p>
            </div>
            <div>
              <Label htmlFor="statusPaiement">Status de Paiement</Label>
              <div className="mt-1">
                <Badge variant={statusVariants[paiement.statusPaiement] || "secondary"}>
                  {statusLabels[paiement.statusPaiement] || paiement.statusPaiement}
                </Badge>
              </div>
            </div>
            <div>
              <Label htmlFor="datePaiement">Date de Paiement</Label>
              <p id="datePaiement" className="text-lg">{paiement.datePaiement ? new Date(paiement.datePaiement).toLocaleDateString('fr-FR') : "N/A"}</p>
            </div>
            <div>
              <Label htmlFor="montant">Montant</Label>
              <p id="montant" className="text-lg font-semibold">{paiement.montant ? `${paiement.montant.toLocaleString('fr-FR')} $` : "N/A"}</p>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <p id="description" className="text-lg whitespace-pre-wrap">{paiement.description?.trim() || "—"}</p>
            </div>
            <div>
              <Label>Date de création</Label>
              <p className="text-sm text-gray-600">{new Date(paiement.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <Label>Dernière mise à jour</Label>
              <p className="text-sm text-gray-600">{new Date(paiement.updatedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/paiement-banque">Retour à la liste</Link>
              </Button>
              <Button asChild>
                <Link href={`/dashboard/paiement-banque/${paiement.id}`}>Modifier</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
