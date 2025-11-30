import Link from "next/link";
import { findByIdAction } from "../../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Droplet, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function ViewTankPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await findByIdAction(id);

  if (!response.success || !response.result) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Tank introuvable.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/tank">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  const tank = response.result;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/tank">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Droplet className="h-8 w-8 text-primary" />
                Détails du Tank: {tank.name}
              </h1>
              <p className="text-muted-foreground">Visualisation complète du tank</p>
            </div>
          </div>
          <Link href={`/dashboard/tank/${tank.id}`}>
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
          <CardDescription>Détails du tank</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Nom</Label>
              <p className="text-lg font-semibold">{tank.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Capacité</Label>
              <p className="text-lg">{tank.capacity} {tank.unit}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Niveau actuel</Label>
              <p className="text-lg font-semibold text-primary">{tank.currentLevel} {tank.unit}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Dépôt</Label>
              <p className="text-lg">{tank.depot?.name ?? "N/A"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Produit</Label>
              <p className="text-lg">{tank.produit?.name ?? "N/A"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Taux de remplissage</Label>
              <div className="mt-2">
                <Badge variant={
                  (tank.currentLevel / tank.capacity) > 0.8 ? "default" : 
                  (tank.currentLevel / tank.capacity) > 0.5 ? "secondary" : 
                  "destructive"
                }>
                  {((tank.currentLevel / tank.capacity) * 100).toFixed(1)}%
                </Badge>
              </div>
            </div>
          </div>
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
                {new Date(tank.createdAt).toLocaleDateString('fr-FR', { 
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
                {new Date(tank.updatedAt).toLocaleDateString('fr-FR', { 
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
