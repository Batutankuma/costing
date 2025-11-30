import { Card, CardContent } from "@/components/ui/card";
import { Fuel } from "lucide-react";
import { getProducts } from "@/app/dashboard/products/actions";
import KinshasaCostingForm from "../kinshasa-costing-form";

export default async function CreateKinshasaCostingPage() {
  const products = await getProducts();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Fuel className="h-9 w-9 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Nouveau Costing Kinshasa</h1>
              <p className="text-muted-foreground">Définissez une structure de prix liée à un produit.</p>
            </div>
          </div>
        </div>
      </div>
      <Card>
        <CardContent className="pt-6">
          <KinshasaCostingForm products={products} />
        </CardContent>
      </Card>
    </div>
  );
}

