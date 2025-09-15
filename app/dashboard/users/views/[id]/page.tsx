import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function ViewUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Utilisateur introuvable.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/users">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Détails de l'utilisateur</CardTitle>
          <CardDescription>Informations détaillées sur l'utilisateur.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Nom</Label>
              <p id="name" className="text-lg font-semibold">{user.name ?? "N/A"}</p>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <p id="email" className="text-lg">{user.email}</p>
            </div>
            <div>
              <Label>Vérifié</Label>
              <p className="text-sm text-gray-600">{user.emailVerified ? "Oui" : "Non"}</p>
            </div>
            <div>
              <Label>Date de Création</Label>
              <p className="text-sm text-gray-600">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "N/A"}
              </p>
            </div>
            <div>
              <Label>Dernière Mise à Jour</Label>
              <p className="text-sm text-gray-600">
                {user.updatedAt
                  ? new Date(user.updatedAt).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "N/A"}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button asChild variant="outline">
                <Link href="/dashboard/users">Retour à la liste</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


