import { getKalemieBuilderById } from "../../actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import KalemieExportButtons from "../export-buttons";

interface Props { params: Promise<{ id: string }> }

export default async function ViewKalemiePage({ params }: Props) {
  const { id } = await params;
  const res = await getKalemieBuilderById(id);
  const it = (res as any)?.result;

  const to = (v?: number | null) => (typeof v === "number" ? v : 0);
  const customsSubtotal = to(it?.customs?.customsDutyUSD) + to(it?.customs?.importVATUSD);
  const leviesTotal = to(it?.levies?.totalLeviesUSD);
  const freight = to(it?.transport?.freightToMineUSD);
  const losses = to(it?.transport?.lossesLitresPerTruck);
  const ddu = to(it?.baseCosts?.acquisitionCostUSD) + to(it?.supplierDDU?.storageHospitalityUSD) + to(it?.supplierDDU?.anrDechargementUSD) + to(it?.supplierDDU?.supplierMarginUSD) + freight + losses;
  const ddp = ddu + customsSubtotal + leviesTotal;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/build-const-kalemie"><Button variant="outline">Retour</Button></Link>
        <h1 className="text-2xl font-semibold">Build-Const Kalemie</h1>
        <div className="ml-auto"><KalemieExportButtons item={it} /></div>
      </div>
      <table className="w-full text-sm border">
        <thead>
          <tr className="bg-muted/40">
            <th className="text-left p-2">Description</th>
            <th className="text-right p-2">USD/M³</th>
          </tr>
        </thead>
        <tbody>
          {it?.baseCosts && (<>
            <tr><td className="p-2">FOB Dar</td><td className="p-2 text-right">{to(it.baseCosts.plattsFOBUSD)}</td></tr>
            <tr><td className="p-2">Transport (camion) jusqu'à Kigoma</td><td className="p-2 text-right">{to(it.baseCosts.truckTransportUSD)}</td></tr>
            <tr><td className="p-2">Expenses Lac Tanganyika</td><td className="p-2 text-right">{to(it.baseCosts.agencyCustomsUSD)}</td></tr>
            <tr><td className="p-2">Brut C&F</td><td className="p-2 text-right">{to(it.baseCosts.brutCFUSD)}</td></tr>
            <tr className="bg-yellow-50 font-medium"><td className="p-2">Prix de revient</td><td className="p-2 text-right">{to(it.baseCosts.acquisitionCostUSD)}</td></tr>
          </>)}
          {it?.supplierDDU && (<>
            <tr><td className="p-2">Frais stockage/hospitality</td><td className="p-2 text-right">{to(it.supplierDDU.storageHospitalityUSD)}</td></tr>
            <tr><td className="p-2">ANR-Dechargement-OCC-Hydrocarbures</td><td className="p-2 text-right">{to(it.supplierDDU.anrDechargementUSD)}</td></tr>
            <tr><td className="p-2">Marge</td><td className="p-2 text-right">{to(it.supplierDDU.supplierMarginUSD)}</td></tr>
            <tr className="bg-yellow-50 font-medium"><td className="p-2">DDU (ex depot)</td><td className="p-2 text-right">{ddu}</td></tr>
          </>)}
          {it?.customs && (<>
            <tr><td className="p-2">B. Total Droits Douaniers & TVA</td><td className="p-2 text-right">{customsSubtotal}</td></tr>
          </>)}
          {it?.transport && (<>
            <tr><td className="p-2">Freight to Mine</td><td className="p-2 text-right">{freight}</td></tr>
            <tr><td className="p-2">Pertes (300 L)</td><td className="p-2 text-right">{losses}</td></tr>
          </>)}
          <tr className="bg-blue-50 font-semibold"><td className="p-2">Taxes</td><td className="p-2 text-right">{customsSubtotal + leviesTotal}</td></tr>
          <tr className="bg-green-50 font-bold"><td className="p-2">DDP (all paid)</td><td className="p-2 text-right">{ddp}</td></tr>
        </tbody>
      </table>
    </div>
  );
}


