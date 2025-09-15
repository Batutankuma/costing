import { Suspense } from "react";
import { getNonMiningPriceStructures } from "../actions";
import { NonMiningBuilderCreateForm } from "./non-mining-builder-create-form";

async function CreateNonMiningBuilderPage() {
  const src = await getNonMiningPriceStructures();
  // Adapter les types potentiels null -> undefined pour la forme attendue du composant
  const priceStructures = (src ?? []).map((s: any) => ({
    id: s.id,
    nomStructure: s.nomStructure,
    exchangeRate: {
      rate: s?.exchangeRate?.rate ?? 0,
      deviseBase: s?.exchangeRate?.deviseBase ?? "CDF",
      deviseTarget: s?.exchangeRate?.deviseTarget ?? "USD",
    },
    fiscality: s?.fiscality ? {
      customsDuty: s.fiscality.customsDuty ?? 0,
      importVAT: s.fiscality.importVAT ?? 0,
      netVAT: s.fiscality.netVAT ?? 0,
      consumptionDuty: s.fiscality.consumptionDuty ?? 0,
    } : undefined,
    parafiscality: s?.parafiscality ? {
      foner: s.parafiscality.foner ?? 0,
    } : undefined,
    securityStock: s?.securityStock ? {
      estStock: s.securityStock.estStock ?? 0,
      sudStock: s.securityStock.sudStock ?? 0,
    } : undefined,
  }));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Nouveau Cost Build Up Non-Minier</h1>
        <p className="text-muted-foreground">
          Créez une nouvelle structure de coûts pour les produits non-miniers
        </p>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <NonMiningBuilderCreateForm priceStructures={priceStructures} />
      </Suspense>
    </div>
  );
}

export default CreateNonMiningBuilderPage;
