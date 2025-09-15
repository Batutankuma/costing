import { DataTable } from "./data-table";
import { columns } from "./columns";
import { getNonMiningPrices } from "./actions";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function NonMiningPricesPage() {
  const data = await getNonMiningPrices();

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Prix Non-Minier</h1>
            <p className="text-muted-foreground mt-2">
              Gestion des structures de prix officielles pour le secteur non-minier
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/non-mining-prices/create">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Structure
            </Link>
          </Button>
        </div>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
