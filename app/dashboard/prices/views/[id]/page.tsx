import { findByIdAction } from "../../actions";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import ExportButtons from "../export-buttons";

export default async function ViewPricePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await findByIdAction(id);
  const item = (res as any)?.result;

  if (!item) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Structure introuvable.</p>
        </div>
        <Link className="underline" href="/dashboard/prices">Retour</Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{item.nomStructure}</h1>
        <Link href={`/dashboard/prices/${item.id}`}>
          <Button variant="outline">Modifier</Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label className="text-lg font-semibold text-orange-400">P.M.F. Commercial (PMFC)</Label>
          <div className="grid md:grid-cols-2 gap-4 mt-2">
            <div>
              <Label>PMF (CDF)</Label>
              <Input disabled value={item.pmfCommercialCDF?.toLocaleString("fr-FR")} />
            </div>
            <div>
              <Label>PMF (USD)</Label>
              <Input disabled value={item.pmfCommercialUSD?.toLocaleString("fr-FR")} />
            </div>
          </div>
        </div>

        <div>
          <Label className="text-lg font-semibold text-orange-400">Taux & Références</Label>
          <div className="grid md:grid-cols-2 gap-4 mt-2">
            <div>
              <Label>Taux</Label>
              <Input disabled value={item.exchangeRate?.rate?.toLocaleString("fr-FR")} />
            </div>
            <div>
              <Label>Date</Label>
              <Input disabled value={new Date(item.date).toLocaleDateString()} />
            </div>
          </div>
        </div>
      </div>

      <Label className="text-lg font-semibold text-orange-400">Sociétés de logistique</Label>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label>Frais d'entrepôt (CDF)</Label>
          <Input disabled value={item.logisticsCosts?.warehouseFee?.toLocaleString("fr-FR")} />
        </div>
        <div>
          <Label>Total (CDF)</Label>
          <Input disabled value={item.logisticsCosts?.total?.toLocaleString("fr-FR")} />
        </div>
        <div>
          <Label>Total (USD)</Label>
          <Input disabled value={(item.logisticsCosts?.total ? (item.logisticsCosts.total / item.exchangeRate.rate) : 0).toLocaleString("fr-FR")} />
        </div>
      </div>

      <Label className="text-lg font-semibold text-orange-400">Sociétés Commerciales</Label>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label>Charges SOC. Com. (CDF)</Label>
          <Input disabled value={item.commercialCosts?.socComFee?.toLocaleString("fr-FR")} />
        </div>
        <div>
          <Label>Marge (CDF)</Label>
          <Input disabled value={item.commercialCosts?.margin?.toLocaleString("fr-FR")} />
        </div>
        <div>
          <Label>Total (CDF)</Label>
          <Input disabled value={item.commercialCosts?.total?.toLocaleString("fr-FR")} />
        </div>
      </div>

      <Label className="text-lg font-semibold text-orange-400">Parafiscalité</Label>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label>Stock sécurité 1</Label>
          <Input disabled value={item.parafiscality?.stockSecurity1?.toLocaleString("fr-FR")} />
        </div>
        <div>
          <Label>Stock sécurité 2</Label>
          <Input disabled value={item.parafiscality?.stockSecurity2?.toLocaleString("fr-FR")} />
        </div>
        <div>
          <Label>Marquage moléculaire</Label>
          <Input disabled value={item.parafiscality?.molecularMarking?.toLocaleString("fr-FR")} />
        </div>
        <div>
          <Label>FONER</Label>
          <Input disabled value={item.parafiscality?.foner?.toLocaleString("fr-FR")} />
        </div>
        <div>
          <Label>Reconstruction & Stock</Label>
          <Input disabled value={item.parafiscality?.reconstructionEffort?.toLocaleString("fr-FR")} />
        </div>
        <div>
          <Label>Intervention & autres</Label>
          <Input disabled value={item.parafiscality?.intervention?.toLocaleString("fr-FR")} />
        </div>
        <div>
          <Label>Total Parafiscalité (CDF)</Label>
          <Input disabled value={item.parafiscality?.total?.toLocaleString("fr-FR")} />
        </div>
      </div>

      <Label className="text-lg font-semibold text-orange-400">Fiscalité</Label>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label>TVA à la vente (CDF)</Label>
          <Input disabled value={item.fiscality?.venteVAT?.toLocaleString("fr-FR")} />
        </div>
        <div>
          <Label>Droits de douane (CDF)</Label>
          <Input disabled value={item.fiscality?.customsDuty?.toLocaleString("fr-FR")} />
        </div>
        <div>
          <Label>Droits de consommation (CDF)</Label>
          <Input disabled value={item.fiscality?.consumptionDuty?.toLocaleString("fr-FR")} />
        </div>
        <div>
          <Label>TVA importation (CDF)</Label>
          <Input disabled value={item.fiscality?.importVAT?.toLocaleString("fr-FR")} />
        </div>
        <div>
          <Label>TVA nette à l'intérieur (CDF)</Label>
          <Input disabled value={item.fiscality?.netVAT?.toLocaleString("fr-FR")} />
        </div>
        <div>
          <Label>Total Fiscalité 1 (CDF)</Label>
          <Input disabled value={item.fiscality?.total1?.toLocaleString("fr-FR")} />
        </div>
        <div>
          <Label>Total Fiscalité 2 (CDF)</Label>
          <Input disabled value={item.fiscality?.total2?.toLocaleString("fr-FR")} />
        </div>
      </div>

      <Label className="text-lg font-semibold text-orange-400">Récapitulatif</Label>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label>Prix de référence en CDF / M3</Label>
          <Input disabled value={item.priceRefCDF?.toLocaleString("fr-FR")} />
        </div>
        <div>
          <Label>Prix de référence en USD / M3</Label>
          <Input disabled value={item.priceRefUSD?.toLocaleString("fr-FR")} />
        </div>
        <div>
          <Label>Prix de référence à appliquer (USD/Litre)</Label>
          <Input disabled value={item.priceRefUSDPerLitre?.toLocaleString("fr-FR")} />
        </div>
      </div>

      <div className="flex justify-end">
        <ExportButtons item={item} />
      </div>
    </div>
  );
}


