"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreatePriceReferenceSchema } from "@/models/mvc.pruned";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAction } from "next-safe-action/hooks";
import { createPriceReference } from "../actions";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type FormData = z.infer<typeof CreatePriceReferenceSchema>;

export default function CreatePricePage() {
  const router = useRouter();
  const { executeAsync, status } = useAction(createPriceReference);
  const isPending = status === "executing";
  const { data: session } = authClient.useSession();

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: zodResolver(CreatePriceReferenceSchema),
    shouldFocusError: false,
    defaultValues: {
      nomStructure: "",
      description: "",
      structureSociete: "SOCIETE_AUTRE",
      cardinale: "SUD",
      rate: undefined,
      pmfCommercialCDF: 0,
      userId: "",
      logistics: { warehouseFee: 0 },
      commercial: { socComFee: 0, marginPercent: 10 },
      parafiscality: {},
      fiscality: {},
    },
  });

  console.log(errors);

  // Preview helper – optional input; server remains authoritative
  const parseNum = (v: any) => {
    if (v === "" || v === null || v === undefined) return 0;
    if (typeof v === "number") return Number.isFinite(v) ? v : 0;
    if (typeof v === "string") {
      const n = parseFloat(v.replace(",", "."));
      return Number.isFinite(n) ? n : 0;
    }
    return 0;
  };
  const pmfCDF = watch("pmfCommercialCDF");
  const whFee = watch("logistics.warehouseFee");
  const socFee = watch("commercial.socComFee");
  const marginPct = watch("commercial.marginPercent");
  const p1 = watch("parafiscality.stockSecurity1") || 0;
  const p2 = watch("parafiscality.stockSecurity2") || 0;
  const pm = watch("parafiscality.molecularMarking") || 0;
  const pf = watch("parafiscality.foner") || 0;
  const pr = watch("parafiscality.reconstructionEffort") || 0;
  const pi = watch("parafiscality.intervention") || 0;
  const v11 = watch("fiscality.venteVAT") || 0;
  const v12 = watch("fiscality.customsDuty") || 0;
  const v13 = watch("fiscality.consumptionDuty") || 0;
  const v14 = watch("fiscality.importVAT") || 0;
  const vNet = watch("fiscality.netVAT") || 0;

  // Optional local preview of rate to compute margin-based totals visually
  const [ratePreview, setRatePreview] = React.useState<number | "">("");
  const [showRateError, setShowRateError] = React.useState(false);
  const isRateValid = typeof ratePreview === "number" && ratePreview > 0;
  const toUSD = (v: number | undefined) => (typeof ratePreview === "number" && ratePreview > 0 ? Number(v || 0) / ratePreview : undefined);
  const pmfUSDPreview = toUSD(Number(pmfCDF || 0));
  const marginPreview = Number(marginPct || 0);
  const logisticsTotal = Number(whFee || 0);
  const commercialTotal = (Number(socFee || 0) + (marginPreview ?? 0));
  const paraTotal = Number(p1 + p2 + pm + pf + pr + pi);
  const fiscalTotal1 = Number(v11 + v12 + v13 + v14);
  const fiscalTotal2 = Number(fiscalTotal1 + Number(vNet || 0));
  const priceRefCDFPreview = Number(pmfCDF || 0) + logisticsTotal + commercialTotal + paraTotal + fiscalTotal2;
  const priceRefUSDPreview = toUSD(priceRefCDFPreview);
  const priceRefUSDPerLitrePreview = priceRefUSDPreview !== undefined ? priceRefUSDPreview / 1000 : undefined;

  React.useEffect(() => {
    if (session?.user?.id) {
      setValue("userId", session.user.id as any, { shouldDirty: false, shouldTouch: false, shouldValidate: false });
    }
  }, [session?.user?.id, setValue]);

  const onSubmit = async (data: any) => {
    // Avoid keeping focus on any input after submit
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    // Force auto totals for fiscality from detailed lines
    const total1 = (data.fiscality.venteVAT ?? 0) + (data.fiscality.customsDuty ?? 0) + (data.fiscality.consumptionDuty ?? 0) + (data.fiscality.importVAT ?? 0);
    data.fiscality.total1 = total1;
    // For now we mirror total2 to total1 (server may compute differently if needed)
    data.fiscality.total2 = total1;
    // Set rate from preview and derive PMF USD
    if (typeof ratePreview === "number" && ratePreview > 0) {
      data.rate = ratePreview;
      if (typeof data.pmfCommercialCDF === "number") {
        data.pmfCommercialUSD = Number((data.pmfCommercialCDF / ratePreview).toFixed(6));
      }
    }
    // Convertir la marge saisie (CDF) en pourcentage attendu par l'API
    const marginAmountCDF = data?.commercial?.marginPercent ?? 0;
    if (typeof data.pmfCommercialCDF === "number" && data.pmfCommercialCDF > 0) {
      data.commercial.marginPercent = Number(((marginAmountCDF / data.pmfCommercialCDF) * 100).toFixed(6));
    } else {
      data.commercial.marginPercent = 0;
    }
    const res = await executeAsync(data);
    if ((res as any)?.data?.success) {
      router.push("/dashboard/prices");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Créer une structure de prix</h1>
      <form onSubmit={handleSubmit(onSubmit as any)} className="grid gap-6">
        <div className="grid md:grid-cols-2 gap-2">
          <div>
            <Label>Nom structure</Label>
            <Input {...register("nomStructure")} />
            {errors.nomStructure && <p className="text-red-500 text-sm">{String(errors.nomStructure.message)}</p>}
          </div>
          <div>
            <Label>Taux (aperçu local)</Label>
            <Input type="number" step="0.0001" value={ratePreview as any} onChange={(e) => {
              const raw = e.target.value;
              const normalized = raw.replace(",", ".");
              const next = normalized === "" ? "" : Number(normalized);
              setRatePreview(next as any);
              if (typeof next === "number" && next > 0) setShowRateError(false);
              // Sync field `rate` as number for Zod resolver
              if (typeof next === "number" && Number.isFinite(next)) {
                setValue("rate", next, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
              } else {
                setValue("rate", undefined as any, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
              }
            }} placeholder="Ex: 2858.6" />
            {showRateError && <p className="text-red-500 text-sm">Veuillez saisir un taux valide</p>}
          </div>

        </div>
        {/* Champ caché supprimé: le champ `rate` est désormais synchronisé par setValue ci-dessus */}
        <div className="grid md:grid-cols-2 gap-2">
          <div>
            <Label>Structure de société</Label>
            <select className="h-9 w-full rounded-md border border-border bg-background px-3" defaultValue="SOCIETE_AUTRE" {...register("structureSociete")}>
              <option value="SOCIETE_MINE">Société minière</option>
              <option value="SOCIETE_AUTRE">Autre société</option>
            </select>
          </div>
          <div>
            <Label>Cardinale</Label>
            <select className="h-9 w-full rounded-md border border-border bg-background px-3" defaultValue="SUD" {...register("cardinale")}>
              <option value="SUD">Sud</option>
              <option value="NORD">Nord</option>
              <option value="EST">Est</option>
              <option value="OUEST">Ouest</option>
            </select>
          </div>
        </div>
        <input type="hidden" {...register("userId")} />
        {/* P.M.F. Commercial (PMFC) */}
        <label htmlFor="pmf" className="text-lg font-semibold justify-center align-bottom text-orange-400">P.M.F. Commercial (PMFC)</label>
        <div className="grid md:grid-cols-3 gap-4">
          <Label>PMF</Label>
          <div>
            <Label>PMF (CDF)</Label>
            <Input type="number" step="0.01" {...register("pmfCommercialCDF", { setValueAs: parseNum })} />
          </div>
          <div>
            <Label>PMF (USD – aperçu)</Label>
            <Input disabled value={pmfUSDPreview !== undefined ? pmfUSDPreview.toFixed(6) : "-"} />
          </div>
        </div>
        {/* Sociétés de logistique */}
        <label htmlFor="pmf" className="text-lg font-semibold justify-center align-bottom text-orange-400">Sociétés de logistique</label>
        <div className="grid md:grid-cols-3 gap-4">
          <Label> Charges d'exploitation logisticiens</Label>
          <Input type="number" step="0.01" {...register("logistics.warehouseFee", { setValueAs: parseNum })} placeholder="Entrepôt (CDF)" />
          <Input disabled value={toUSD(logisticsTotal) !== undefined ? toUSD(logisticsTotal)!.toFixed(6) : "-"} />
        </div>

        {/* Sociétés de commercialisation */}
        <label htmlFor="logistique" className="text-lg font-semibold justify-center align-bottom text-orange-400">Sociétés Commerciales</label>

        <div className="grid md:grid-cols-3 gap-4">
          <Label>Charges d'exploitation SOC. Com.</Label>
          <div>
            <Label>SOC. Com. (CDF)</Label>
            <Input type="number" step="0.01" {...register("commercial.socComFee", { setValueAs: parseNum })} placeholder="SOC. Com. (CDF)" />
          </div>
          <div>
            <Label>(USD – aperçu)</Label>
            <Input disabled value={toUSD(socFee) !== undefined ? toUSD(socFee)!.toFixed(6) : "-"} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Label>Marges Sociétés commerciales</Label>
          <div>
            <Label>Marge (CDF)</Label>
            <Input className="mt-2" type="number" step="0.01" {...register("commercial.marginPercent", { setValueAs: parseNum })} placeholder="Marge en CDF" />
          </div>
          <div>
            <Label className="mt-2">(USD – aperçu)</Label>
            <Input disabled value={toUSD(marginPreview) !== undefined ? toUSD(marginPreview)!.toFixed(6) : "-"} />
          </div>
        </div>

        {/* Parafiscalité */}
        <label htmlFor="logistique" className="text-lg font-semibold justify-center align-bottom text-orange-400">Parafiscalité</label>

        <div className="grid md:grid-cols-3 gap-4">
          <Label>Stock sécurité 1</Label>
          <div>
            <Label>Secu. (CDF)</Label>
            <Input type="number" step="0.01" {...register("parafiscality.stockSecurity1", { setValueAs: parseNum })} placeholder="Stock sécurité 1" />
          </div>
          <div>
            <Label>(USD – aperçu)</Label>
            <Input disabled value={toUSD(p1) !== undefined ? toUSD(p1)!.toFixed(6) : "-"} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Label>Stock sécurité 2</Label>
          <div>
            <Label>Secu. (CDF)</Label>
            <Input type="number" step="0.01" {...register("parafiscality.stockSecurity2", { setValueAs: parseNum })} placeholder="Stock sécurité 2" />
          </div>
          <div>
            <Label>(USD – aperçu)</Label>
            <Input disabled value={toUSD(p2) !== undefined ? toUSD(p2)!.toFixed(6) : "-"} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Label>Marquage Moléculaire</Label>
          <div>
            <Label>Marquage Moléculaire (CDF)</Label>
            <Input type="number" step="0.01" {...register("parafiscality.molecularMarking", { setValueAs: parseNum })} placeholder="Marquage moléculaire" />
          </div>
          <div>
            <Label>(USD – aperçu)</Label>
            <Input disabled value={toUSD(pm) !== undefined ? toUSD(pm)!.toFixed(6) : "-"} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Label>FONER</Label>
          <div>
            <Label>FONER (CDF)</Label>
            <Input type="number" step="0.01" {...register("parafiscality.foner", { setValueAs: parseNum })} placeholder="FONER" />
          </div>
          <div>
            <Label>(USD – aperçu)</Label>
            <Input disabled value={toUSD(pf) !== undefined ? toUSD(pf)!.toFixed(6) : "-"} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Label>Reconstruction & Stock</Label>
          <div>
            <Label>Reconstruction & Stock (CDF)</Label>
            <Input type="number" step="0.01" {...register("parafiscality.reconstructionEffort", { setValueAs: parseNum })} placeholder="Reconstruction & Stock" />
          </div>
          <div>
            <Label>(USD – aperçu)</Label>
            <Input disabled value={toUSD(pr) !== undefined ? toUSD(pr)!.toFixed(6) : "-"} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Label>Intervention & autres</Label>
          <div>
            <Label>Intervention & autres (CDF)</Label>
            <Input type="number" step="0.01" {...register("parafiscality.intervention", { setValueAs: parseNum })} placeholder="Intervention & autres" />
          </div>
          <div>
            <Label>(USD – aperçu)</Label>
            <Input disabled value={toUSD(pi) !== undefined ? toUSD(pi)!.toFixed(6) : "-"} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">

          <Label>Total Parafiscalité (auto)</Label>
          <Input disabled value={paraTotal.toFixed(1)} />
        </div>

        {/* Fiscalite */}
        <label htmlFor="logistique" className="text-lg font-semibold justify-center align-bottom text-orange-400">Fiscalité</label>
        <div className="grid md:grid-cols-3 gap-4">
          <Label>TVA a la vente (TVAV) pour calcul</Label>
          <div>
            <Label>TVA (CDF)</Label>
            <Input type="number" step="0.01" {...register("fiscality.venteVAT", { setValueAs: parseNum })} />
          </div>
          <div>
            <Label>(USD – aperçu)</Label>
            <Input disabled value={toUSD(v11) !== undefined ? toUSD(v11)!.toFixed(6) : "-"} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Label>Droits de Douane (10% PMF Commercial)</Label>
          <div>
            <Label>Droits Douane (CDF)</Label>
            <Input type="number" step="0.01" {...register("fiscality.customsDuty", { setValueAs: parseNum })} />
          </div>
          <div>
            <Label>(USD – aperçu)</Label>
            <Input disabled value={toUSD(v12) !== undefined ? toUSD(v12)!.toFixed(6) : "-"} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Label>Droits Consommation </Label>
          <div>
            <Label>Droits Consommation (CDF)</Label>
            <Input type="number" step="0.01" {...register("fiscality.consumptionDuty", { setValueAs: parseNum })} />
          </div>
          <div>
            <Label>(USD – aperçu)</Label>
            <Input disabled value={toUSD(v13) !== undefined ? toUSD(v13)!.toFixed(6) : "-"} />
          </div>
        </div>


        <div className="grid md:grid-cols-3 gap-4">
          <Label>TVA importation </Label>
          <div>
            <Label>TVA importation (CDF)</Label>
            <Input type="number" step="0.01" {...register("fiscality.importVAT", { setValueAs: parseNum })} />
          </div>
          <div>
            <Label>(USD – aperçu)</Label>
            <Input disabled value={toUSD(v14) !== undefined ? toUSD(v14)!.toFixed(6) : "-"} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Label>TVA Nette à l'intérieur </Label>
          <div>
            <Label>TVA (CDF)</Label>
            <Input type="number" step="0.01" {...register("fiscality.netVAT", { setValueAs: parseNum })} />
          </div>
          <div>
            <Label>(USD – aperçu)</Label>
            <Input disabled value={toUSD(vNet) !== undefined ? toUSD(vNet)!.toFixed(6) : "-"} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Label>Total Fiscalité 1 (auto)</Label>
          <Input disabled value={fiscalTotal1.toFixed(1)} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Label>Total Fiscalité 2 (auto)</Label>
          <Input disabled value={fiscalTotal2.toFixed(1)} />
        </div>

        <label className="text-lg font-semibold justify-center align-bottom text-orange-400">Récapitulatif</label>
        <div className="grid md:grid-cols-2 gap-4">
          <Label>Prix de référence en CDF / M3</Label>
          <Input disabled value={Number.isFinite(priceRefCDFPreview) ? priceRefCDFPreview.toFixed(1) : "-"} />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Label>Prix de référence en USD / M3</Label>
          <Input disabled value={priceRefUSDPreview !== undefined ? priceRefUSDPreview.toFixed(1) : "-"} />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Label>Prix de référence à appliquer (USD/Litre)</Label>
          <Input disabled value={priceRefUSDPerLitrePreview !== undefined ? priceRefUSDPerLitrePreview.toFixed(1) : "-"} />
        </div>





        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>{isPending ? "Enregistrement..." : "Enregistrer"}</Button>
        </div>
      </form>
    </div>
  );
}


