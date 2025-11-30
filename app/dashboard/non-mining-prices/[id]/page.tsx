import { getNonMiningPriceById } from "../actions";
import { NonMiningPriceEditForm } from "./non-mining-price-edit-form";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, DollarSign } from "lucide-react";
import Link from "next/link";

interface NonMiningPriceEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function NonMiningPriceEditPage({ params }: NonMiningPriceEditPageProps) {
  try {
    const { id } = await params;
    const priceStructure = await getNonMiningPriceById(id);
    
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/non-mining-prices">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
          </Link>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-primary" />
              Modifier la Structure de Prix
            </h1>
            <p className="text-muted-foreground">
              Modifiez les détails de la structure de prix non-minier
            </p>
          </div>
        </div>
        
        <NonMiningPriceEditForm priceStructure={priceStructure} />
      </div>
    );
  } catch (error) {
    notFound();
  }
}
