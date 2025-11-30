import prisma from "@/lib/prisma";
import DataTables from "./data-table"; // Renommé de DataFournisseur à DataTables

export default async function Page() {
  const data = await prisma.fournisseur.findMany({ orderBy: { createdAt: 'desc' } });
  return (
    <div>
      <h1 className="text-2xl mb-2 font-semibold">Fournisseurs</h1>
      <DataTables Element={data || []} />
    </div>
  );
}
