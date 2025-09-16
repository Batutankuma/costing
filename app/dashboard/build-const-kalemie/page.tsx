import Link from "next/link";
import { listKalemieBuilders } from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function KalemieBuildersPage() {
  const res = await listKalemieBuilders();
  const items = (res as any)?.result ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Build-Const Kalemie</h1>
          <p className="text-muted-foreground">Gestion des coûts et totaux pour Kalemie</p>
        </div>
        <Link href="/dashboard/build-const-kalemie/create">
          <Button>Nouvelle construction</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste</CardTitle>
          <CardDescription>Entrées filtrées par Kalemie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Date</th>
                  <th className="py-2">Titre</th>
                  <th className="py-2">Unité</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it: any) => (
                  <tr key={it.id} className="border-b last:border-0">
                    <td className="py-2">{new Date(it.date).toLocaleDateString("fr-FR")}</td>
                    <td className="py-2">{it.title}</td>
                    <td className="py-2">{it.unit}</td>
                    <td className="py-2 text-right">
                      <Link href={`/dashboard/build-const-kalemie/views/${it.id}`} className="underline mr-3">Voir</Link>
                      <Link href={`/dashboard/build-const-kalemie/${it.id}`} className="underline">Modifier</Link>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td className="py-6 text-center text-muted-foreground" colSpan={4}>Aucune donnée Kalemie</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




