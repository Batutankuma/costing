export const dynamic = "force-dynamic";
export const revalidate = 0;
import { listPriceReferences } from "./actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DataTable from "./data-table";

export default async function Page() {
  const res = await listPriceReferences();
  const items = (res as any)?.data?.result ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Structures de prix</h1>
        <Link href="/dashboard/prices/create">
        </Link>
      </div>
      <DataTable items={items} />
    </div>
  );
}


