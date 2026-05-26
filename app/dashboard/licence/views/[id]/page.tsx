import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function ViewLicencePage({ params }: { params: Promise<{ id: string }> }) {
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
        <Button variant="outline" asChild>
          <Link href="/dashboard/licence">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  const validiteLabels: Record<string, string> = {
    VALIDE: "Valide",
    EXPIREE: "Expirée",
    EN_ATTENTE: "En attente",
    SUSPENDUE: "Suspendue",
  };

  const validiteVariants: Record<string, "default" | "destructive" | "secondary"> = {
    VALIDE: "default",
    EXPIREE: "destructive",
    EN_ATTENTE: "secondary",
    SUSPENDUE: "secondary",
  };

  return (
    <div className="p-6">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Détails de la Licence</CardTitle>
          <CardDescription>Informations détaillées sur la licence d'import.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <Label htmlFor="commande">Commande</Label>
              <p id="commande" className="text-lg font-semibold">{licence.commande?.reference || "N/A"}</p>
            </div>
            <div>
              <Label htmlFor="banque">Banque</Label>
              <p id="banque" className="text-lg">{licence.banque?.nom || "N/A"}</p>
            </div>
            <div>
              <Label htmlFor="validiteLicence">Validité Licence</Label>
              <div className="mt-1">
                <Badge variant={validiteVariants[licence.validiteLicence] || "secondary"}>
                  {validiteLabels[licence.validiteLicence] || licence.validiteLicence}
                </Badge>
              </div>
            </div>
            <div>
              <Label htmlFor="numeroBulletin">N° Bulletin</Label>
              <p id="numeroBulletin" className="text-lg">{licence.numeroBulletin ?? "N/A"}</p>
            </div>
            <div>
              <Label htmlFor="numeroLicenceImport">N° Licence Import</Label>
              <p id="numeroLicenceImport" className="text-lg">{licence.numeroLicenceImport ?? "N/A"}</p>
            </div>
            <div>
              <Label htmlFor="numeroLettreEngagement">Numéro de Lettre Engagement</Label>
              <p id="numeroLettreEngagement" className="text-lg">{licence.numeroLettreEngagement ?? "N/A"}</p>
            </div>
            <div>
              <Label htmlFor="statusJustification">Status de justification</Label>
              <div className="mt-1">
                <Badge variant={licence.statusJustification ? "default" : "secondary"}>
                  {licence.statusJustification ? "Oui" : "Non"}
                </Badge>
              </div>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <p id="description" className="text-lg whitespace-pre-wrap">
                {licence.description?.trim() ? licence.description : "N/A"}
              </p>
            </div>
            <div>
              <Label htmlFor="dateJustification">Date de justification</Label>
              <p id="dateJustification" className="text-lg">
                {licence.dateJustification
                  ? new Date(licence.dateJustification).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A"}
              </p>
            </div>
            <div>
              <Label>Date de création</Label>
              <p className="text-sm text-gray-600">{new Date(licence.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <Label>Dernière mise à jour</Label>
              <p className="text-sm text-gray-600">{new Date(licence.updatedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/licence">Retour à la liste</Link>
              </Button>
              <Button asChild>
                <Link href={`/dashboard/licence/${licence.id}`}>Modifier</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
