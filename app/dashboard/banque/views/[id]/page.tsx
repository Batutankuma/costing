import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function ViewBanquePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const banque = await prisma.banque.findUnique({ where: { id } });

  if (!banque) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Banque introuvable.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/banque">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Détails de la Banque</CardTitle>
          <CardDescription>Informations détaillées sur la banque.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <Label htmlFor="nom">Nom</Label>
              <p id="nom" className="text-lg font-semibold">{banque.nom}</p>
            </div>
            <div>
              <Label htmlFor="numeroCompte">Numéro de Compte</Label>
              <p id="numeroCompte" className="text-lg">{banque.numeroCompte}</p>
            </div>
            <div>
              <Label htmlFor="devise">Devise</Label>
              <div className="mt-1">
                <Badge variant="outline">{banque.devise}</Badge>
              </div>
            </div>
            <div>
              <Label htmlFor="swift">SWIFT</Label>
              <p id="swift" className="text-lg">{banque.swift ?? "N/A"}</p>
            </div>
            <div>
              <Label htmlFor="mailGestionnaire">Email du Gestionnaire</Label>
              <p id="mailGestionnaire" className="text-lg">{banque.mailGestionnaire ?? "N/A"}</p>
            </div>
            <div>
              <Label htmlFor="contactGestionnaire">Contact du Gestionnaire</Label>
              <p id="contactGestionnaire" className="text-lg">{banque.contactGestionnaire ?? "N/A"}</p>
            </div>
            <div>
              <Label>Date de création</Label>
              <p className="text-sm text-gray-600">{new Date(banque.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <Label>Dernière mise à jour</Label>
              <p className="text-sm text-gray-600">{new Date(banque.updatedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/banque">Retour à la liste</Link>
              </Button>
              <Button asChild>
                <Link href={`/dashboard/banque/${banque.id}`}>Modifier</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
