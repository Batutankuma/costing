import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getHospitalityById } from "../actions";
import EditHospitalityForm from "./edit-form";

function toDateInputValue(date: Date) {
  return new Date(date).toISOString().split("T")[0];
}

export default async function EditHospitalityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hospitality = await getHospitalityById(id);
  if (!hospitality) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Ligne hospitality introuvable.</p>
        </div>
        <Link href="/dashboard/hospitality" className="inline-block underline">
          Retour a la liste
        </Link>
      </div>
    );
  }

  const [suppliers, transporters, depots, stocks] = await Promise.all([
    prisma.fournisseur.findMany({ select: { id: true, nom: true }, orderBy: { nom: "asc" } }),
    prisma.transporteur.findMany({ select: { id: true, nom: true }, orderBy: { nom: "asc" } }),
    prisma.depot.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.stock.findMany({ select: { id: true, reference: true, depotId: true }, orderBy: { reference: "asc" } }),
  ]);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/hospitality">
          <Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="h-4 w-4" />Retour</Button>
        </Link>
        <div className="h-6 w-px bg-border" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modifier Hospitality</h1>
          <p className="text-muted-foreground">Depot Lubumbashi</p>
        </div>
      </div>

      <EditHospitalityForm
        suppliers={suppliers}
        transporters={transporters}
        depots={depots}
        stocks={stocks}
        initial={{
          id: hospitality.id,
          driverName: hospitality.driverName,
          supplierId: hospitality.supplierId,
          transporterId: hospitality.transporterId,
          truckNo: hospitality.truckNo,
          trailerNo: hospitality.trailerNo,
          loadingDate: toDateInputValue(hospitality.loadingDate),
          entryDate: toDateInputValue(hospitality.entryDate),
          offlDate: toDateInputValue(hospitality.offlDate),
          quantityOrder: hospitality.quantityOrder,
          actualQuantity20L: hospitality.actualQuantity20L,
          offlQtyObs: hospitality.offlQtyObs,
          offlQty20: hospitality.offlQty20,
          depotId: hospitality.depotId,
          stockId: hospitality.stockId,
          rate: hospitality.rate,
        }}
      />
    </div>
  );
}
