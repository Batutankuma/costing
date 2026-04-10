import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const getModuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
        FINANCE: "Finance",
        CRM: "CRM",
        DEPOT_AUTRES: "Dépôt Autres",
        DEPOT_KALEMIE: "Dépôt Kalemie",
        DEPOT_LUBUMBASHI: "Dépôt Lubumbashi",
        DEPOT_KINSHASA: "Dépôt Kinshasa",
        OPERATION: "Opération",
    };
    return labels[type] || type;
};

export default async function ViewModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const moduleItem = await prisma.module.findUnique({ 
    where: { id },
    include: {
      _count: {
        select: {
          userModules: true
        }
      }
    }
  });

  if (!moduleItem) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Module introuvable.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/settings/modules">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Détails du Module</CardTitle>
          <CardDescription>Informations détaillées sur le module.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name">Nom</Label>
                <p id="name" className="text-lg font-semibold">{moduleItem.name}</p>
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <div id="type" className="mt-1">
                  <Badge variant="outline">{getModuleTypeLabel(moduleItem.type)}</Badge>
                </div>
              </div>
            </div>

            {moduleItem.description && (
              <div>
                <Label htmlFor="description">Description</Label>
                <p id="description" className="text-lg">{moduleItem.description}</p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="isActive">Statut</Label>
                <div id="isActive" className="mt-1">
                  <Badge variant={moduleItem.isActive ? "default" : "secondary"}>
                    {moduleItem.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </div>
              </div>
              <div>
                <Label htmlFor="userCount">Nombre d&apos;utilisateurs</Label>
                <p id="userCount" className="text-lg">{moduleItem._count.userModules}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
              <div>
                <Label>Date de création</Label>
                <p className="text-sm text-gray-600">{new Date(moduleItem.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div>
                <Label>Dernière mise à jour</Label>
                <p className="text-sm text-gray-600">{new Date(moduleItem.updatedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/settings/modules">Retour à la liste</Link>
              </Button>
              <Button asChild>
                <Link href={`/dashboard/settings/modules/${moduleItem.id}`}>Modifier</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
