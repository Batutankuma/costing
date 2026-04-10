import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

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

export default async function UsersModulesPage() {
  const users = await prisma.user.findMany({
    include: {
      userModules: {
        include: {
          module: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl mb-2 font-semibold">Utilisateurs et Modules</h1>
          <p className="text-muted-foreground">Gérez les modules attribués aux utilisateurs</p>
        </div>
        <Link href="/dashboard/users/create">
          <Button className="gap-2">
            <Users className="h-4 w-4" />
            Nouvel Utilisateur
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle className="text-lg">{user.name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm font-medium">Modules attribués:</div>
                {user.userModules.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.userModules.map((userModule) => (
                      <Badge key={userModule.id} variant="outline">
                        {getModuleTypeLabel(userModule.module.type)}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun module attribué</p>
                )}
                <div className="pt-2">
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href={`/dashboard/settings/users-modules/${user.id}`}>
                      Gérer les modules
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
