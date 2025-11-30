import { NonMiningPriceCreateForm } from "./non-mining-price-create-form";
import { getExchangeRates } from "../actions";
import { Button } from "@/components/ui/button";
import { ArrowLeft, DollarSign } from "lucide-react";
import Link from "next/link";

export default async function CreateNonMiningPricePage() {
  const exchangeRates = await getExchangeRates();

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
            Nouvelle Structure de Prix Non-Minier
          </h1>
          <p className="text-muted-foreground">
            Créez une nouvelle structure de prix officielle pour le secteur non-minier
          </p>
        </div>
      </div>
      
      <NonMiningPriceCreateForm exchangeRates={exchangeRates} />
    </div>
  );
}
