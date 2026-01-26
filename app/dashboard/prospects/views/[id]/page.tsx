import Link from "next/link";
import { getProspectById } from "../../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Edit, Building2, Mail, Phone, Globe, MapPin, DollarSign, Calendar, Tag } from "lucide-react";
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
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Société
              </Label>
              <p className="text-lg">{prospect.company ?? "N/A"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <p className="text-lg">{prospect.email ?? "N/A"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Téléphone
              </Label>
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
            {prospect.owner && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Propriétaire</Label>
                <p className="text-lg">{prospect.owner.name}</p>
                {prospect.owner.email && (
                  <p className="text-sm text-muted-foreground">{prospect.owner.email}</p>
                )}
              </div>
            )}
          </div>
          {prospect.notes && (
            <div className="mt-4">
              <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
              <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{prospect.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informations de Qualification */}
      {(prospect.jobTitle || prospect.website || prospect.address || prospect.city || prospect.country || prospect.potentialValue || prospect.expectedCloseDate || (prospect.tags && prospect.tags.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle>Informations de Qualification</CardTitle>
            <CardDescription>Détails supplémentaires pour la qualification du prospect</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prospect.jobTitle && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Poste</Label>
                  <p className="text-lg">{prospect.jobTitle}</p>
                </div>
              )}
              {prospect.website && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Site web
                  </Label>
                  <a href={prospect.website} target="_blank" rel="noopener noreferrer" className="text-lg text-blue-600 hover:underline">
                    {prospect.website}
                  </a>
                </div>
              )}
              {prospect.address && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Adresse
                  </Label>
                  <p className="text-lg">{prospect.address}</p>
                </div>
              )}
              {prospect.city && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Ville</Label>
                  <p className="text-lg">{prospect.city}</p>
                </div>
              )}
              {prospect.country && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Pays</Label>
                  <p className="text-lg">{prospect.country}</p>
                </div>
              )}
              {prospect.potentialValue && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Valeur potentielle
                  </Label>
                  <p className="text-lg font-semibold text-green-600">
                    {prospect.potentialValue.toLocaleString('fr-FR')} USD
                  </p>
                </div>
              )}
              {prospect.expectedCloseDate && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date de clôture prévue
                  </Label>
                  <p className="text-lg">
                    {new Date(prospect.expectedCloseDate).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
            {prospect.tags && prospect.tags.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {prospect.tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

