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
            <div>
              <Label htmlFor="nom">Nom</Label>
              <p id="nom" className="text-lg font-semibold">{fournisseur.nom}</p>
            </div>
            <div>
              <Label htmlFor="adresse">Adresse</Label>
              <p id="adresse" className="text-lg">{fournisseur.adresse ?? "N/A"}</p>
            </div>
            <div>
              <Label>Date de création</Label>
              <p className="text-sm text-gray-600">{new Date(fournisseur.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <Label>Dernière mise à jour</Label>
              <p className="text-sm text-gray-600">{new Date(fournisseur.updatedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
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