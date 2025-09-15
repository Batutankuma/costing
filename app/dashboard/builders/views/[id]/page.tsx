import { findBuilderById } from "../../actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ExportButtons from "../export-buttons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function ViewBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await findBuilderById(id);
  const item = (res as any)?.result;

  if (!item) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Structure introuvable.</p>
        </div>
        <Link className="underline" href="/dashboard/builders">Retour</Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{item.title}</h1>
        <Link href={`/dashboard/builders/${item.id}`}>
          <Button variant="outline">Modifier</Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label>Titre</Label>
          <Input disabled value={item.title} />
        </div>
        <div>
          <Label>Date</Label>
          <Input disabled value={new Date(item.date).toLocaleDateString()} />
        </div>
      </div>

      <Label className="text-lg font-semibold text-orange-400">Coûts de base du produit & transport initial</Label>
      <div className="grid md:grid-cols-5 gap-4">
        <div><Label>Platt's/FOB</Label><Input disabled value={item.baseCosts?.plattsFOBUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
        <div><Label>Transport (camion)</Label><Input disabled value={item.baseCosts?.truckTransportUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
        <div><Label>Brut C&F</Label><Input disabled value={item.baseCosts?.brutCFUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
        <div><Label>Agency/Customs</Label><Input disabled value={item.baseCosts?.agencyCustomsUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
        <div><Label>Prix de revient</Label><Input disabled value={item.baseCosts?.acquisitionCostUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
      </div>

      <Label className="text-lg font-semibold text-orange-400">Coûts & marge du fournisseur (DDU)</Label>
      <div className="grid md:grid-cols-4 gap-4">
        <div><Label>Stockage/Hospitalité</Label><Input disabled value={item.supplierDDU?.storageHospitalityUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
        <div><Label>ANR-Déchargement</Label><Input disabled value={item.supplierDDU?.anrDechargementUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
        <div><Label>Marge fournisseur</Label><Input disabled value={item.supplierDDU?.supplierMarginUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
        <div><Label>Prix DDU</Label><Input disabled value={item.supplierDDU?.sellingPriceDDUUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
      </div>

      <Label className="text-lg font-semibold text-orange-400">Coûts collectés par la douane</Label>
      <div className="grid md:grid-cols-3 gap-4">
        <div><Label>Droits de douane</Label><Input disabled value={item.customs?.customsDutyUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
        <div><Label>TVA import</Label><Input disabled value={item.customs?.importVATUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
        <div><Label>Sous-total</Label><Input disabled value={item.customs?.subtotalUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
      </div>

      <Label className="text-lg font-semibold text-orange-400">Redevances (Levies)</Label>
      <div className="grid md:grid-cols-3 gap-4">
        <div><Label>FONER</Label><Input disabled value={item.levies?.fonerUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
        <div><Label>Stock Séc. / Moléculaire</Label><Input disabled value={item.levies?.molecularMarkingOrStockUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
        <div><Label>Reconstruction & Stratégique</Label><Input disabled value={item.levies?.reconstructionStrategicUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
        <div><Label>Intervention Éco. & Autres</Label><Input disabled value={item.levies?.economicInterventionUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
        <div><Label>Total Droits & TVA</Label><Input disabled value={item.levies?.totalDutiesAndVATUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
        <div><Label>Total Redevances</Label><Input disabled value={item.levies?.totalLeviesUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
      </div>

      <Label className="text-lg font-semibold text-orange-400">Transport additionnel</Label>
      <div className="grid md:grid-cols-4 gap-4">
        <div><Label>Freight to Mine</Label><Input disabled value={item.transport?.freightToMineUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
        <div><Label>Pertes (L)</Label><Input disabled value={item.transport?.lossesLitresPerTruck?.toLocaleString("fr-FR") ?? "-"} /></div>
        <div><Label>Valeur des pertes</Label><Input disabled value={item.transport?.lossesValueUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
        <div><Label>Total transport final</Label><Input disabled value={item.transport?.totalTransportFinalUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
      </div>

      <Label className="text-lg font-semibold text-orange-400">Récapitulatif</Label>
      <div className="grid md:grid-cols-4 gap-4">
        <div><Label>Total Douanes</Label><Input disabled value={item.totals?.totalCustomsUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
        <div><Label>Total Redevances</Label><Input disabled value={item.totals?.totalLeviesUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
        <div><Label>Prix DDU</Label><Input disabled value={item.totals?.priceDDUUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
        <div><Label>Prix DDP</Label><Input disabled value={item.totals?.priceDDPUSD?.toLocaleString("fr-FR") ?? "-"} /></div>
      </div>

      <div className="flex justify-end">
        <ExportButtons item={item} />
      </div>
    </div>
  );
}


