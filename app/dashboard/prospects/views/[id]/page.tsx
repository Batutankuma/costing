import Link from "next/link";
import { getProspectById } from "../../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const stageVariantByStage: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  NEW: "default",
  CONTACTED: "outline",
  QUALIFIED: "secondary",
  WON: "default",
  LOST: "destructive",
};

const stageLabels: Record<string, string> = {
  NEW: "Nouveau",
  CONTACTED: "Contacté", 
  QUALIFIED: "Qualifié",
  WON: "Gagné",
  LOST: "Perdu"
};

export default async function ViewProspectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prospect = await getProspectById(id);

  if (!prospect) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Prospect introuvable.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/prospects">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/prospects">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                Détails du Prospect: {prospect.name}
              </h1>
              <p className="text-muted-foreground">Visualisation complète du prospect</p>
            </div>
          </div>
          <Link href={`/dashboard/prospects/${prospect.id}`}>
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
          <CardDescription>Détails du prospect</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Nom</Label>
              <p className="text-lg font-semibold">{prospect.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Société</Label>
              <p className="text-lg">{prospect.company ?? "N/A"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <p className="text-lg">{prospect.email ?? "N/A"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Téléphone</Label>
              <p className="text-lg">{prospect.phone ?? "N/A"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Source</Label>
              <p className="text-lg">{prospect.source ?? "N/A"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Étape</Label>
              <div className="mt-2">
                <Badge variant={stageVariantByStage[prospect.stage]}>
                  {stageLabels[prospect.stage]}
                </Badge>
              </div>
            </div>
          </div>
          {prospect.notes && (
            <div className="mt-4">
              <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
              <p className="text-sm text-gray-600 mt-2">{prospect.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations Système</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Date de création</Label>
              <p className="text-sm text-gray-600">
                {new Date(prospect.createdAt).toLocaleDateString('fr-FR', { 
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
                {new Date(prospect.updatedAt).toLocaleDateString('fr-FR', { 
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

