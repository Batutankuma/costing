import prisma from "@/lib/prisma";
import CreateHospitalityForm from "./create-form";

export default async function CreateHospitalityPage() {
  const [suppliers, transporters, depots, stocks] = await Promise.all([
    prisma.fournisseur.findMany({ select: { id: true, nom: true }, orderBy: { nom: "asc" } }),
    prisma.transporteur.findMany({ select: { id: true, nom: true }, orderBy: { nom: "asc" } }),
    prisma.depot.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.stock.findMany({ select: { id: true, reference: true, depotId: true }, orderBy: { reference: "asc" } }),
  ]);

  return <CreateHospitalityForm suppliers={suppliers} transporters={transporters} depots={depots} stocks={stocks} />;
}
