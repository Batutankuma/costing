import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function ViewFournisseurPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fournisseur = await prisma.fournisseur.findUnique({ where: { id } });

  if (!fournisseur) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Fournisseur introuvable.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/crm/fournisseur">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Détails du Fournisseur</CardTitle>
          <CardDescription>Informations détaillées sur le fournisseur.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="company">Société</Label>
                <p id="company" className="text-lg font-semibold">{fournisseur.company ?? fournisseur.nom}</p>
              </div>
              <div>
                <Label htmlFor="contactName">Nom du contact</Label>
                <p id="contactName" className="text-lg">{fournisseur.contactName ?? "-"}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {fournisseur.email && (
                <div>
                  <Label htmlFor="email">Email du contact</Label>
                  <p id="email" className="text-lg">{fournisseur.email}</p>
                </div>
              )}
              {fournisseur.phone && (
                <div>
                  <Label htmlFor="phone">Téléphone du contact</Label>
                  <p id="phone" className="text-lg">{fournisseur.phone}</p>
                </div>
              )}
            </div>

            {fournisseur.adresse && (
              <div>
                <Label htmlFor="adresse">Adresse</Label>
                <p id="adresse" className="text-lg">{fournisseur.adresse}</p>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
              {fournisseur.rccm && (
                <div>
                  <Label htmlFor="rccm">RCCM</Label>
                  <p id="rccm" className="text-lg">{fournisseur.rccm}</p>
                </div>
              )}
              {fournisseur.idNat && (
                <div>
                  <Label htmlFor="idNat">ID NAT</Label>
                  <p id="idNat" className="text-lg">{fournisseur.idNat}</p>
                </div>
              )}
              {fournisseur.nif && (
                <div>
                  <Label htmlFor="nif">NIF</Label>
                  <p id="nif" className="text-lg">{fournisseur.nif}</p>
                </div>
              )}
            </div>

            {fournisseur.pays && (
              <div>
                <Label htmlFor="pays">Pays</Label>
                <p id="pays" className="text-lg">{fournisseur.pays}</p>
              </div>
            )}

            {fournisseur.notes && (
              <div>
                <Label htmlFor="notes">Notes</Label>
                <p id="notes" className="text-lg">{fournisseur.notes}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
              <div>
                <Label>Date de création</Label>
                <p className="text-sm text-gray-600">{new Date(fournisseur.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div>
                <Label>Dernière mise à jour</Label>
                <p className="text-sm text-gray-600">{new Date(fournisseur.updatedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/crm/fournisseur">Retour à la liste</Link>
              </Button>
              <Button asChild>
                <Link href={`/dashboard/crm/fournisseur/${fournisseur.id}`}>Modifier</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}