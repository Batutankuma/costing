import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default async function HospitalityViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const row = await prisma.hospitality.findUnique({
    where: { id },
    include: {
      supplier: { select: { nom: true } },
      transporter: { select: { nom: true } },
      depot: { select: { name: true } },
      stock: { select: { reference: true } },
    },
  });

  if (!row) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Ligne hospitality introuvable.</p>
        </div>
        <Link href="/dashboard/hospitality" className="underline">Retour a la liste</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/hospitality">
          <Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="h-4 w-4" />Retour</Button>
        </Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detail Hospitality - {row.driverName}</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
          <p><strong>Supplier:</strong> {row.supplier.nom}</p>
          <p><strong>Transporter:</strong> {row.transporter.nom}</p>
          <p><strong>Depot:</strong> {row.depot.name}</p>
          <p><strong>Stock:</strong> {row.stock.reference}</p>
          <p><strong>Truck No.:</strong> {row.truckNo}</p>
          <p><strong>Trailer No.:</strong> {row.trailerNo}</p>
          <p><strong>Loading Date:</strong> {row.loadingDate.toLocaleDateString("fr-FR")}</p>
          <p><strong>Entry Date:</strong> {row.entryDate.toLocaleDateString("fr-FR")}</p>
          <p><strong>OFFL Date:</strong> {row.offlDate.toLocaleDateString("fr-FR")}</p>
          <p><strong>Quantity Order:</strong> {row.quantityOrder}</p>
          <p><strong>Actual quantity @20 (L):</strong> {row.actualQuantity20L}</p>
          <p><strong>OFFL QTY @OBS:</strong> {row.offlQtyObs}</p>
          <p><strong>OFFL QTY @20:</strong> {row.offlQty20}</p>
          <p><strong>VARIANCE QTY @20:</strong> {row.varianceQty20}</p>
          <p><strong>Transit Allowable LOSS:</strong> {row.transitAllowableLoss}</p>
          <p className={row.disAllowableLoss > 0 ? "text-destructive font-semibold" : ""}>
            <strong>Dis-Allowable LOSS:</strong> {row.disAllowableLoss}
          </p>
          <p><strong>Rate ($):</strong> {row.rate}</p>
          <p className={row.total > 0 ? "text-destructive font-semibold" : ""}>
            <strong>Total ($):</strong> {row.total}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
