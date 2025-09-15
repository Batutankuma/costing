import { NonMiningPriceCreateForm } from "./non-mining-price-create-form";
import { getExchangeRates } from "../actions";

export default async function CreateNonMiningPricePage() {
  const exchangeRates = await getExchangeRates();

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-primary">Nouvelle Structure de Prix Non-Minier</h1>
        <p className="text-muted-foreground mt-2">
          Créer une nouvelle structure de prix officielle pour le secteur non-minier
        </p>
      </div>
      <NonMiningPriceCreateForm exchangeRates={exchangeRates} />
    </div>
  );
}
