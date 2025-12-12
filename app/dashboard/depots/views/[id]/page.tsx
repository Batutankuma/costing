import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { getDepotFull } from "../../actions";
import { ArrowLeft, Package, Warehouse, Pencil } from "lucide-react";

interface Props { params: Promise<{ id: string }>; }

export default async function DepotViewPage({ params }: Props) {
  const { id } = await params;
  const depot = await getDepotFull(id);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/depots">
            <Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Retour</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Warehouse className="h-6 w-6 text-primary" />
              Détails du Dépôt
            </h1>
            <p className="text-muted-foreground">Visualisation du dépôt et de ses produits liés</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/depots/${id}`}>
            <Button size="sm" variant="secondary"><Pencil className="mr-2 h-4 w-4" /> Modifier</Button>
          </Link>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {depot?.name}
            <Badge variant="outline">{depot?.type === "OWNED" ? "Interne" : "Externe"}</Badge>
          </CardTitle>
          <CardDescription>Informations générales du dépôt</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nom</p>
              <p className="font-medium">{depot?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium">{depot?.type === "OWNED" ? "Interne" : "Externe"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Localisation</p>
              <p className="font-medium">{depot?.location ?? "—"}</p>
            </div>
          </div>
          <Separator className="my-6" />
          <h3 className="font-semibold flex items-center gap-2"><Package className="h-4 w-4" /> Produits liés</h3>
          <div className="overflow-x-auto mt-3 rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b bg-muted/50">
                  <th className="py-2 px-3">Produit</th>
                  <th className="py-2 px-3">Unité</th>
                  <th className="py-2 px-3 text-right">Quantité</th>
                </tr>
              </thead>
              <tbody>
                {(depot?.products ?? []).length === 0 && (
                  <tr>
                    <td className="py-6 px-3 text-center text-muted-foreground" colSpan={3}>Aucun produit lié</td>
                  </tr>
                )}
                {(depot?.products ?? []).map((dp: { id: string; product?: { name?: string | null; unit?: string | null } | null; quantity?: number | null }) => (
                  <tr key={dp.id} className="border-b last:border-0">
                    <td className="py-2 px-3">{dp.product?.name}</td>
                    <td className="py-2 px-3">{dp.product?.unit}</td>
                    <td className="py-2 px-3 text-right">{(dp.quantity ?? 0).toLocaleString("fr-FR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


