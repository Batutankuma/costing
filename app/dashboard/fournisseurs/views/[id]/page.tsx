import Link from "next/link";
import { getFournisseurById } from "../../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Edit } from "lucide-react";

export default async function ViewFournisseurPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fournisseur = await getFournisseurById(id);

  if (!fournisseur) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Fournisseur introuvable.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/fournisseurs">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/fournisseurs">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Building2 className="h-8 w-8 text-primary" />
                Détails du Fournisseur: {fournisseur.nom}
              </h1>
              <p className="text-muted-foreground">Visualisation complète du fournisseur</p>
            </div>
          </div>
          <Link href={`/dashboard/fournisseurs/${fournisseur.id}`}>
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
          <CardDescription>Détails du fournisseur</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Nom</Label>
              <p className="text-lg font-semibold">{fournisseur.nom}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Adresse</Label>
              <p className="text-lg">{fournisseur.adresse ?? "N/A"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Date de création</Label>
              <p className="text-sm text-gray-600">
                {new Date(fournisseur.createdAt).toLocaleDateString('fr-FR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Dernière mise à jour</Label>
              <p className="text-sm text-gray-600">
                {new Date(fournisseur.updatedAt).toLocaleDateString('fr-FR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

