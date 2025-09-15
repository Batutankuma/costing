import { Suspense } from "react";
import { getNonMiningBuilderById, getNonMiningPriceStructures } from "../actions";
import { NonMiningBuilderEditForm } from "./non-mining-builder-edit-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface NonMiningBuilderEditPageProps {
  params: Promise<{ id: string }>;
}

async function NonMiningBuilderEditPage({ params }: NonMiningBuilderEditPageProps) {
  const { id } = await params;
  
  const [builder, priceStructures] = await Promise.all([
    getNonMiningBuilderById(id),
    getNonMiningPriceStructures(),
  ]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/non-mining-builders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Modifier le Cost Build Up</h1>
            <p className="text-muted-foreground">
              Modifiez les détails du cost build up non-minier
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <NonMiningBuilderEditForm builder={builder} priceStructures={priceStructures} />
      </Suspense>
    </div>
  );
}

export default NonMiningBuilderEditPage;
