import prisma from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users - Dashboard",
};

import DataTables from "./data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function Page() {
  const data = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Utilisateurs</h1>
            <p className="text-muted-foreground">Gestion des utilisateurs</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
          <CardDescription>Visualisez et gérez les utilisateurs</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTables Element={data} />
        </CardContent>
      </Card>
    </div>
  );
}


