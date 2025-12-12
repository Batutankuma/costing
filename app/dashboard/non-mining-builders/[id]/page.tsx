import { Suspense } from "react";
import { getNonMiningBuilderById, getNonMiningPriceStructures } from "../actions";
import { NonMiningBuilderEditForm } from "./non-mining-builder-edit-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calculator } from "lucide-react";
import Link from "next/link";

interface NonMiningBuilderEditPageProps {
  params: Promise<{ id: string }>;
}

async function NonMiningBuilderEditPage({ params }: NonMiningBuilderEditPageProps) {
  const { id } = await params;
  
  const [builder, rawPriceStructures] = await Promise.all([
    getNonMiningBuilderById(id),
    getNonMiningPriceStructures(),
  ]);

  const priceStructures = (rawPriceStructures ?? []).map((s: any) => ({
    id: s.id,
    nomStructure: s.nomStructure,
    exchangeRate: {
      rate: s.exchangeRate?.rate ?? 0,
      deviseBase: s.exchangeRate?.deviseBase ?? "",
      deviseTarget: s.exchangeRate?.deviseTarget ?? "",
    },
    fiscality: s.fiscality
      ? {
          customsDuty: s.fiscality.customsDuty ?? 0,
          importVAT: s.fiscality.importVAT ?? 0,
          netVAT: s.fiscality.netVAT ?? 0,
          consumptionDuty: s.fiscality.consumptionDuty ?? 0,
        }
      : undefined,
    parafiscality: s.parafiscality
      ? {
          foner: s.parafiscality.foner ?? 0,
        }
      : undefined,
    securityStock: s.securityStock
      ? {
          estStock: s.securityStock.estStock ?? 0,
          sudStock: s.securityStock.sudStock ?? 0,
        }
      : undefined,
  }));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/non-mining-builders">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div className="h-6 w-px bg-border" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calculator className="h-8 w-8 text-primary" />
            Modifier le Cost Build Up
          </h1>
          <p className="text-muted-foreground">
            Modifiez les détails du cost build up non-minier
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <NonMiningBuilderEditForm builder={builder} priceStructures={priceStructures} />
      </Suspense>
    </div>
  );
}

export default NonMiningBuilderEditPage;
