import Link from "next/link";
import { getTransportRateById } from "../../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Truck, Edit } from "lucide-react";

export default async function ViewTransportRatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const transportRate = await getTransportRateById(id);

  if (!transportRate) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Tarif de transport introuvable.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/transport-rates">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/transport-rates">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Truck className="h-8 w-8 text-primary" />
                Détails du Tarif: {transportRate.destination}
              </h1>
              <p className="text-muted-foreground">Visualisation complète du tarif de transport</p>
            </div>
          </div>
          <Link href={`/dashboard/transport-rates/${transportRate.id}`}>
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
          <CardDescription>Détails du tarif de transport</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Destination</Label>
              <p className="text-lg font-semibold">{transportRate.destination}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Tarif (USD/CBM)</Label>
              <p className="text-lg font-semibold text-primary">${transportRate.rateUsdPerCbm.toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Date de création</Label>
              <p className="text-sm text-gray-600">
                {new Date(transportRate.createdAt).toLocaleDateString('fr-FR', { 
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
                {new Date(transportRate.updatedAt).toLocaleDateString('fr-FR', { 
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

