import prisma from "@/lib/prisma";
import CreateHospitalityForm from "./create-form";

export default async function CreateHospitalityPage() {
  const [suppliers, transporters, depots, commandes] = await Promise.all([
    prisma.fournisseur.findMany({ select: { id: true, nom: true }, orderBy: { nom: "asc" } }),
    prisma.transporteur.findMany({ select: { id: true, nom: true }, orderBy: { nom: "asc" } }),
    prisma.depot.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.commande.findMany({ select: { id: true, reference: true, depotId: true, quantite: true }, orderBy: { reference: "asc" } }),
  ]);

  const commandesWithNumbers = commandes.map((c) => ({ ...c, quantite: Number(c.quantite) }));

  return (
    <CreateHospitalityForm
      suppliers={suppliers}
      transporters={transporters}
      depots={depots}
      commandes={commandesWithNumbers}
    />
  );
}
