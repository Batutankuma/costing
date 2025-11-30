import Link from "next/link";
import { findByIdAction } from "../../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function ViewUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await findByIdAction(id);

  if (!response.success || !response.result) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Utilisateur introuvable.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/users">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  const user = response.result;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/users">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <Users className="h-8 w-8 text-primary" />
                Détails de l'Utilisateur: {user.name}
              </h1>
              <p className="text-muted-foreground">Visualisation complète de l'utilisateur</p>
            </div>
          </div>
          <Link href={`/dashboard/users/${user.id}`}>
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
          <CardDescription>Détails de l'utilisateur</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Nom</Label>
              <p className="text-lg font-semibold">{user.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <p className="text-lg">{user.email}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Rôle</Label>
              <div className="mt-2">
                <Badge variant={(user.role as string) === "admin" ? "default" : "secondary"}>
                  {user.role}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Email vérifié</Label>
              <div className="mt-2">
                <Badge variant={user.emailVerified ? "default" : "destructive"}>
                  {user.emailVerified ? "Oui" : "Non"}
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
                {new Date(user.createdAt).toLocaleDateString('fr-FR', { 
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
                {new Date(user.updatedAt).toLocaleDateString('fr-FR', { 
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
