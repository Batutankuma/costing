import DepotCreateForm from "./depot-create-form";
import { getProducts } from "@/app/dashboard/products/actions";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type ProductRef = {
  id: string;
  name: string;
  unit: string;
};

export default async function CreateDepotPage() {
  const products = await getProducts();
  const suggestions = (products ?? []).map((p: ProductRef) => ({ id: p.id, name: p.name, unit: p.unit }));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/depots">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div className="h-6 w-px bg-border" />
        <div>
          <h1 className="text-2xl font-semibold">Nouveau dépôt</h1>
          <p className="text-sm text-muted-foreground">Créez un nouveau dépôt pour stocker vos produits</p>
        </div>
      </div>

      <DepotCreateForm suggestions={suggestions} />
    </div>
  );
}
