export const dynamic = "force-dynamic";
export const revalidate = 0;
import { listPriceReferences } from "./actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DataTable from "./data-table";
import { Plus } from "lucide-react";

export default async function Page() {
  const res = await listPriceReferences();
  const items = (res as any)?.data?.result ?? [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Structures de prix</h1>
            <p className="text-muted-foreground">Gestion des références de prix</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/prices/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Structure
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <DataTable items={items} />
    </div>
  );
}


