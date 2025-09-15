import { Suspense } from "react";
import { getNonMiningBuilderById } from "../../actions";
import { NonMiningBuilderView } from "./non-mining-builder-view";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { NonMiningBuilderActionsBar } from "./actions-bar";

interface NonMiningBuilderViewPageProps {
  params: Promise<{ id: string }>;
}

async function NonMiningBuilderViewPage({ params }: NonMiningBuilderViewPageProps) {
  const { id } = await params;
  
  const builder = await getNonMiningBuilderById(id);

  const rate = builder.nonMiningPriceStructure?.exchangeRate?.rate ?? 1;
  const toUSD = (v?: number | null) => (typeof v === "number" ? v : 0);

  const exportHtml = `<!DOCTYPE html><html><head><style>table{border-collapse:collapse;width:100%;font-family:Arial}th,td{border:1px solid #9ca3af;padding:6px;text-align:right}th:first-child,td:first-child{text-align:left}.y{background:#fff3b0;font-weight:bold}.b{background:#dbeafe;font-weight:bold}.g{background:#dcfce7;font-weight:bold}</style></head><body><table><tr><th>Description</th><th>USD</th></tr>
  ${builder.baseCosts ? `<tr><td>Platt's or FOB</td><td>${toUSD(builder.baseCosts.plattsFOBUSD)}</td></tr>
  <tr><td>Transport (camion)</td><td>${toUSD(builder.baseCosts.truckTransportUSD)}</td></tr>
  <tr><td>Brut C&F</td><td>${toUSD(builder.baseCosts.brutCFUSD)}</td></tr>
  <tr><td>Agency/Trade Sce/Customs</td><td>${toUSD(builder.baseCosts.agencyCustomsUSD)}</td></tr>
  <tr class='y'><td>Prix de revient</td><td>${toUSD(builder.baseCosts.acquisitionCostUSD)}</td></tr>` : ``}
  ${builder.supplierDDU ? `<tr><td>Stockage/Hospitalité</td><td>${toUSD(builder.supplierDDU.storageHospitalityUSD)}</td></tr>
  <tr><td>ANR-Déchargement</td><td>${toUSD(builder.supplierDDU.anrDechargementUSD)}</td></tr>
  <tr><td>Marge Fournisseur</td><td>${toUSD(builder.supplierDDU.supplierMarginUSD)}</td></tr>
  <tr class='y'><td>Prix DDU</td><td>${toUSD(builder.supplierDDU.sellingPriceDDUUSD)}</td></tr>` : ``}
  ${builder.customs ? `<tr><td>Droits de douane</td><td>${toUSD(builder.customs.customsDutyUSD)}</td></tr>
  <tr><td>TVA import</td><td>${toUSD(builder.customs.importVATUSD)}</td></tr>
  <tr class='y'><td>Total Douanes & TVA</td><td>${toUSD(builder.customs.subtotalUSD)}</td></tr>` : ``}
  ${builder.levies ? `<tr><td>FONER</td><td>${toUSD(builder.levies.fonerUSD ?? 0)}</td></tr>
  <tr><td>Stock Séc./Moléculaire</td><td>${toUSD(builder.levies.molecularMarkingOrStockUSD ?? 0)}</td></tr>
  <tr><td>Reconstruction & Stratégique</td><td>${toUSD(builder.levies.reconstructionStrategicUSD ?? 0)}</td></tr>
  <tr><td>Intervention Éco. & Autres</td><td>${toUSD(builder.levies.economicInterventionUSD ?? 0)}</td></tr>
  <tr class='y'><td>Total Redevances</td><td>${toUSD(builder.levies.totalLeviesUSD ?? 0)}</td></tr>` : ``}
  ${builder.transport ? `<tr><td>Freight to Mine</td><td>${toUSD(builder.transport.freightToMineUSD ?? 0)}</td></tr>
  <tr><td>Pertes par camion</td><td>${toUSD(builder.transport.lossesLitresPerTruck ?? 0)}</td></tr>
  <tr class='y'><td>Total transport final</td><td>${toUSD(builder.transport.totalTransportFinalUSD ?? 0)}</td></tr>` : ``}
  ${builder.totals ? `<tr class='g'><td>Prix DDP</td><td>${toUSD(builder.totals.priceDDPUSD ?? 0)}</td></tr>
  <tr class='b'><td>Prix DDU</td><td>${toUSD(builder.totals.priceDDUUSD ?? 0)}</td></tr>` : ``}
  </table></body></html>`;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 no-print">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/non-mining-builders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Détails du Cost Build Up</h1>
            <p className="text-muted-foreground">
              Visualisation complète du cost build up non-minier
            </p>
          </div>
          <div className="ml-auto"><NonMiningBuilderActionsBar id={id} customHtml={exportHtml} /></div>
        </div>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <NonMiningBuilderView id={id} />
      </Suspense>
    </div>
  );
}

export default NonMiningBuilderViewPage;
