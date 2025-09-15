"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { createQuote, computeBasePrices } from "../actions";
import { listBuilders } from "@/app/dashboard/builders/actions";
import { listQuotes } from "../actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { authClient } from "@/lib/auth-client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import SignaturePad from "@/components/signature-pad";

type Builder = any;

export default function CreateSalesQuotePage() {
  const { toast } = useToast();
  const { data: session } = authClient.useSession();
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [clientId, setClientId] = useState<string>("");
  const [quantityM3, setQuantityM3] = useState<number>(1);
  const [printMode, setPrintMode] = useState<"ddp" | "ddu" | null>(null);
  const [baseDDUUSD, setBaseDDUUSD] = useState<number>(0);
  const [baseDDPUSD, setBaseDDPUSD] = useState<number>(0);
  const [marginUSD, setMarginUSD] = useState<number>(0);
  const [freightToMineUSD, setFreightToMineUSD] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState<string>("");
  const [role, setRole] = useState<"ADMIN" | "COMMERCIAL" | undefined>(undefined);
  const [transportRates, setTransportRates] = useState<Array<{ id: string; destination: string; rateUsdPerCbm: number }>>([]);
  const [marginError, setMarginError] = useState<string | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>("");
  const [tvaApplicable, setTvaApplicable] = useState<boolean>(false);
  const [proformaNumber, setProformaNumber] = useState<string>("");

  const totalDDUUSD = useMemo(() => Number(baseDDUUSD || 0) + Number(marginUSD || 0), [baseDDUUSD, marginUSD]);
  const totalDDPUSD = useMemo(() => Number(baseDDPUSD || 0) + Number(freightToMineUSD || 0), [baseDDPUSD, freightToMineUSD]);
  const lineTotalDDP = useMemo(() => Number(totalDDPUSD || 0) * Number(quantityM3 || 0), [totalDDPUSD, quantityM3]);
  const lineTotalDDU = useMemo(() => Number(totalDDUUSD || 0) * Number(quantityM3 || 0), [totalDDUUSD, quantityM3]);
  const tvaRate = 0.16;
  const tvaDDP = useMemo(() => (tvaApplicable ? Number(lineTotalDDP || 0) * tvaRate : 0), [tvaApplicable, lineTotalDDP]);
  const tvaDDU = useMemo(() => (tvaApplicable ? Number(lineTotalDDU || 0) * tvaRate : 0), [tvaApplicable, lineTotalDDU]);

  useEffect(() => {
    (async () => {
      const res = await listBuilders();
      if (res?.data?.success) setBuilders(res.data.result);
    })();
  }, []);

  // Numéro proforma: index (dernier devis + 1) - MM
  useEffect(() => {
    (async () => {
      try {
        const r = await listQuotes({});
        const items = (r as any)?.data?.result ?? [];
        const next = (Array.isArray(items) ? items.length : 0) + 1;
        const mm = new Date().toLocaleDateString("fr-FR", { month: "2-digit" }).slice(0, 2);
        setProformaNumber(`${String(next).padStart(4, "0")}-${mm}`);
      } catch {
        const mm = new Date().toLocaleDateString("fr-FR", { month: "2-digit" }).slice(0, 2);
        setProformaNumber(`0001-${mm}`);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/clients", { cache: "no-store" });
        if (r.ok) {
          const data = await r.json();
          setClients(Array.isArray(data) ? data.map((c: any) => ({ id: c.id, name: c.name })) : []);
        }
      } catch {
        setClients([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      const r = await computeBasePrices(selectedId);
      if ((r as any).success) {
        const { baseDDUUSD: ddu, baseDDPUSD: ddp } = (r as any).result;
        setBaseDDUUSD(ddu);
        setBaseDDPUSD(ddp);
      }
    })();
  }, [selectedId]);

  // Resolve role (from session, then API fallback)
  useEffect(() => {
    const current = (session?.user as any)?.role as "ADMIN" | "COMMERCIAL" | undefined;
    if (current) {
      setRole(current);
      // Précharger la signature enregistrée sur l'utilisateur s'il y en a une
      const sig = (session?.user as any)?.signatureDataUrl as string | undefined;
      if (sig) setSignatureDataUrl(sig);
      return;
    }
    const email = session?.user?.email;
    if (!email) return;
    fetch(`/api/user-role?email=${encodeURIComponent(email)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.role === "ADMIN" || data?.role === "COMMERCIAL") setRole(data.role);
      })
      .catch(() => void 0);
  }, [session]);

  // Load transport rates
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/transport-rates", { cache: "no-store" });
        if (res.ok) {
          const list = await res.json();
          setTransportRates(Array.isArray(list) ? list : []);
        }
      } catch {
        setTransportRates([]);
      }
    })();
  }, []);

  // Validate margin for COMMERCIAL
  useEffect(() => {
    if (role === "COMMERCIAL" && Number(marginUSD) < 50) {
      setMarginError("La marge doit être supérieure ou égale à 50");
    } else {
      setMarginError(null);
    }
  }, [role, marginUSD]);

  const onSave = async () => {
    if (!session?.user?.id) {
      toast({ title: "Session requise" });
      return false;
    }
    if (!selectedId) {
      toast({ title: "Sélectionnez un Cost Build Up" });
      return false;
    }
    if (role === "COMMERCIAL" && Number(marginUSD) < 50) {
      toast({ title: "Marge invalide", description: "La marge doit être ≥ 50 (profil Commercial)", variant: "destructive" });
      return false;
    }
    setLoading(true);
    const res = await createQuote({
      costBuildUpId: selectedId,
      userId: session.user.id,
      clientId: clientId || undefined,
      baseDDUUSD,
      baseDDPUSD,
      marginUSD,
      freightToMineUSD,
      totalDDUUSD,
      totalDDPUSD,
      description,
      signatureDataUrl: signatureDataUrl || undefined,
      proformaNumber,
      tvaApplicable,
      tvaAmount: tvaApplicable ? Number((Number(lineTotalDDP || 0) * 0.16)) : 0,
    } as any);
    setLoading(false);
    if (res?.data?.success) {
      toast({ title: "Devis enregistré" });
      setMarginUSD(0);
      setFreightToMineUSD(0);
      setDescription("");
      return true;
    } else {
      toast({ title: "Erreur d'enregistrement" });
      return false;
    }
  };

  const triggerPrint = (mode: "ddp" | "ddu") => {
    setPrintMode(mode);
    const cls = mode === "ddp" ? "print-ddp" : "print-ddu";
    document.body.classList.add(cls);
    setTimeout(() => {
      window.print();
      setTimeout(() => document.body.classList.remove(cls), 100);
    }, 150);
  };

  const onSaveAndPrint = async () => {
    const ok = await onSave();
    if (!ok) return;
    triggerPrint("ddp");
  };

  const onSaveAndPrintDDU = async () => {
    const ok = await onSave();
    if (!ok) return;
    triggerPrint("ddu");
  };

  // ===== Helpers: montant en lettres (FR) =====
  const numberToWordsFR = (n: number): string => {
    const units = ["zéro","un","deux","trois","quatre","cinq","six","sept","huit","neuf","dix","onze","douze","treize","quatorze","quinze","seize"]; 
    const tens = ["","dix","vingt","trente","quarante","cinquante","soixante","soixante","quatre-vingt","quatre-vingt"]; 
    const underHundred = (num: number): string => {
      if (num < 17) return units[num];
      if (num < 20) return "dix-" + units[num - 10];
      if (num < 70) {
        const d = Math.floor(num / 10), u = num % 10;
        if (u === 0) return tens[d];
        if (u === 1 && (d === 2 || d === 3 || d === 4 || d === 5)) return tens[d] + " et un";
        return tens[d] + "-" + units[u];
      }
      if (num < 80) return "soixante-" + underHundred(num - 60);
      // 80-99
      if (num === 80) return "quatre-vingts";
      return "quatre-vingt-" + underHundred(num - 80);
    };
    const underThousand = (num: number): string => {
      if (num < 100) return underHundred(num);
      const h = Math.floor(num / 100), r = num % 100;
      if (h === 1) return "cent" + (r ? " " + underHundred(r) : "");
      // plural 'cents' only if no remainder
      return units[h] + " cent" + (r ? " " + underHundred(r) : "s");
    };
    const scale = (num: number, base: number, labelSing: string, labelPl: string) => {
      const q = Math.floor(num / base), r = num % base;
      if (!q) return { head: "", rest: r };
      const lbl = q > 1 ? labelPl : labelSing;
      return { head: (q === 1 && base === 1000 ? "mille" : numberToWordsFR(q) + " " + lbl), rest: r };
    };
    if (n === 0) return units[0];
    let parts: string[] = [];
    let rest = n;
    const milliards = scale(rest, 1_000_000_000, "milliard", "milliards");
    if (milliards.head) parts.push(milliards.head);
    rest = milliards.rest;
    const millions = scale(rest, 1_000_000, "million", "millions");
    if (millions.head) parts.push(millions.head);
    rest = millions.rest;
    const milliers = scale(rest, 1000, "mille", "mille");
    if (milliers.head) parts.push(milliers.head);
    rest = milliers.rest;
    if (rest) parts.push(underThousand(rest));
    return parts.join(" ").replace(/\s+/g, " ").trim();
  };
  const amountToWordsFR = (value: number): string => {
    const euros = Math.floor(value);
    const cents = Math.round((value - euros) * 100);
    const eStr = numberToWordsFR(Math.abs(euros));
    const cStr = numberToWordsFR(Math.abs(cents));
    const sign = value < 0 ? "moins " : "";
    return `${sign}${eStr} dollars américains${cents ? " et " + cStr + " cents" : ""}`;
  };

  const totalDDP_TTC = useMemo(() => Number(lineTotalDDP || 0) + (tvaApplicable ? Number(lineTotalDDP || 0) * 0.16 : 0), [lineTotalDDP, tvaApplicable]);
  const totalDDU_TTC = useMemo(() => Number(lineTotalDDU || 0) + (tvaApplicable ? Number(lineTotalDDU || 0) * 0.16 : 0), [lineTotalDDU, tvaApplicable]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6">
      <div>
        <h1 className="text-2xl font-semibold">Devis commercial</h1>
        <p className="text-sm text-muted-foreground">Proposition DDU / DDP basée sur un Cost Build Up</p>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Client (optionnel)</Label>
            <Button variant="outline" onClick={async () => {
              const name = prompt("Nom du client");
              if (!name) return;
              const r = await fetch("/api/clients", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name }) });
              if (r.ok) {
                const created = await r.json();
                setClients((prev) => [{ id: created.id, name: created.name }, ...prev]);
                setClientId(created.id);
              }
            }}>Ajouter un client</Button>
          </div>
          <Select value={clientId} onValueChange={(v) => setClientId(v)}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Sélectionner un client (facultatif)" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Cost Build Up</Label>
          <Select value={selectedId} onValueChange={(v) => setSelectedId(v)}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {builders.map((b: any) => (
                <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>DDU (base, hors marge)</Label>
            <Input disabled value={Number(baseDDUUSD).toLocaleString("fr-FR")} />
          </div>
          <div>
            <Label>Marge (USD)</Label>
            <Input type="number" step="0.01" value={marginUSD} onChange={(e) => setMarginUSD(Number(e.target.value))} />
            {marginError && <p className="text-red-600 text-xs mt-1">{marginError}</p>}
          </div>
          <div>
            <Label>DDP (base, hors freight)</Label>
            <Input disabled value={Number(baseDDPUSD).toLocaleString("fr-FR")} />
          </div>
          <div>
            <Label>Freight to Mine (USD)</Label>
            <Select value={String(freightToMineUSD || "")} onValueChange={(v) => setFreightToMineUSD(Number(v))}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sélectionner un tarif" />
              </SelectTrigger>
              <SelectContent>
                {transportRates.length === 0 ? (
                  <SelectItem value="0">0</SelectItem>
                ) : (
                  transportRates.map((t) => (
                    <SelectItem key={t.id} value={String(t.rateUsdPerCbm)}>
                      {t.destination} — {t.rateUsdPerCbm} USD/m³
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Quantité (M³)</Label>
            <Input type="number" step="1" value={quantityM3} onChange={(e) => setQuantityM3(Number(e.target.value || 0))} />
          </div>
          <div>
            <Label>PU (USD/M³)</Label>
            <Input disabled value={Number(totalDDPUSD).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} />
          </div>
          <div>
            <Label>Total (USD)</Label>
            <Input disabled value={(Number(totalDDPUSD) * Number(quantityM3 || 0)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-emerald-200 bg-emerald-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-emerald-700 text-base">Total DDU (USD)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-emerald-700">{Number(totalDDUUSD).toLocaleString("fr-FR")}</div>
            </CardContent>
          </Card>
          <Card className="border-sky-200 bg-sky-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sky-700 text-base">Total DDP (USD)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-sky-700">{Number(totalDDPUSD).toLocaleString("fr-FR")}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          <Label>Description (optionnelle)</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notes, contexte..." />
        </div>

        <div className="flex items-center gap-3">
          <input id="tva-appl" type="checkbox" checked={tvaApplicable} onChange={(e) => setTvaApplicable(e.target.checked)} />
          <Label htmlFor="tva-appl">TVA applicable (16%)</Label>
        </div>

        <div className="space-y-2">
          <Label>Signature électronique (optionnelle)</Label>
          <SignaturePad value={signatureDataUrl} onChange={setSignatureDataUrl} />
        </div>

        <div className="flex gap-3">
          <Button onClick={onSaveAndPrint} disabled={loading || !selectedId}>{loading ? "Traitement..." : "Enregistrer et imprimer (DDP)"}</Button>
          <Button onClick={onSaveAndPrintDDU} disabled={loading || !selectedId} variant="secondary">{loading ? "Traitement..." : "Enregistrer et imprimer (DDU)"}</Button>
          <Button variant="outline" onClick={onSave} disabled={loading || !selectedId}>{loading ? "Enregistrement..." : "Enregistrer"}</Button>
        </div>
      </div>

      {/* PRINT LAYOUT */}
      <style jsx global>{`
        @media print {
          body { background: #fff !important; }
          body * { visibility: hidden !important; }
          body.print-ddp .proforma-print-ddp, body.print-ddp .proforma-print-ddp * { visibility: visible !important; }
          body.print-ddu .proforma-print-ddu, body.print-ddu .proforma-print-ddu * { visibility: visible !important; }
          .proforma-print-ddp, .proforma-print-ddu { position: absolute; left: 0; top: 0; width: 100%; padding: 16mm; }
          .no-print { display: none !important; }
          .proforma-table, .proforma-table th, .proforma-table td { border: 1px solid #c7c7c7; border-collapse: collapse; }
        }
      `}</style>

      {/* PRINT DDP */}
      <div className="proforma-print-ddp hidden print:block text-[12px] leading-tight">
        <div className="flex justify-between">
          <div>
            <div className="font-bold text-[18px]">AAGS Petrole et Gaz</div>
            <div className="mt-2">
              <div>Adresse: Immeuble CTC, Av Wagenya n°8778,</div>
              <div>5eme etage, App 501, Kinshasa/Gombe</div>
            </div>
            <div className="mt-2">N° Impôt : A2441781R</div>
          </div>
          <div className="text-right">
            <div className="uppercase tracking-widest text-neutral-400 font-semibold">FACTURE<br/>PROFORMA</div>
            <div className="mt-1 text-xs text-neutral-500">N° {proformaNumber}</div>
            <div className="mt-10">Kinshasa {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-8">
          <div>
            <div className="font-semibold">PROFORMA À :</div>
            <div className="mt-1"><span className="font-semibold">Nom de le société</span> : {(clients.find((c) => c.id === clientId)?.name) || ""}</div>
            <div><span className="font-semibold">Adresse</span>:</div>
          </div>
          <div>
            <div><span className="font-semibold">RCCM:</span></div>
            <div><span className="font-semibold">Id Nat:</span></div>
            <div><span className="font-semibold">NIF:</span></div>
            <div><span className="font-semibold">Bon de Commande :</span></div>
            <div><span className="font-semibold">Validité de l'offre:</span> 30 Jours</div>
          </div>
        </div>

        <div className="text-center font-semibold mt-8">N° PROFORMA {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }).replace(/\//g, "-")}</div>

        <table className="proforma-table w-full mt-4 text-[11px]">
          <thead>
            <tr className="bg-neutral-100">
              <th className="py-2 w-10">#</th>
              <th>PRODUIT</th>
              <th className="w-28">QTY (M3)</th>
              <th className="w-36">P.U (USD/M3)</th>
              <th className="w-44">PRIX TOTAL (USD)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-center">1</td>
              <td className="py-3">
                Carburant (Delivered Duty Paid)
                <div className="text-[11px] text-neutral-500">DDP rendu mine</div>
              </td>
              <td className="text-center">{Number(quantityM3 || 0)}</td>
              <td className="text-center">{Number(totalDDPUSD || 0).toLocaleString("fr-FR", { minimumFractionDigits: 1 })}</td>
              <td className="text-right pr-2">{Number(lineTotalDDP || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td colSpan={4} className="text-right pr-2">&nbsp;</td>
              <td className="text-right pr-2">-</td>
            </tr>
            <tr>
              <td colSpan={4} className="text-right pr-2">&nbsp;</td>
              <td className="text-right pr-2">-</td>
            </tr>
            <tr>
              <td colSpan={4} className="text-right pr-2">TVA 16%</td>
              <td className="text-right pr-2">{tvaApplicable ? (Number(lineTotalDDP || 0) * 0.16).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) : "-"}</td>
            </tr>
            <tr>
              <td colSpan={4} className="text-right pr-2 font-semibold">Total</td>
              <td className="text-right pr-2 font-semibold">{(Number(lineTotalDDP || 0) + (tvaApplicable ? Number(lineTotalDDP || 0) * 0.16 : 0)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-6 text-sm italic text-neutral-700">Le prix indiqué dans le présent devis est fourni à titre indicatif et est susceptible d’être révisé en fonction des fluctuations et de l’évolution du marché.</div>
        <div className="mt-12 text-sm">NOUS VOUS REMERCIONS DE VOTRE CONFIANCE.</div>
        <div className="mt-2 text-sm"><span className="font-semibold">Montant en lettres:</span> {amountToWordsFR(totalDDP_TTC)}</div>

        <div className="mt-16 flex justify-end pr-10">
          <div className="text-center">
            {signatureDataUrl ? (
              <div className="mb-2">
                <img src={signatureDataUrl} alt="Signature" className="h-16 object-contain" />
              </div>
            ) : (
              <div className="mb-16 opacity-70">Signature</div>
            )}
            <div className="text-[11px]">{session?.user?.name || ""}</div>
          </div>
        </div>
      </div>

      {/* PRINT DDU */}
      <div className="proforma-print-ddu hidden print:block text-[12px] leading-tight">
        <div className="flex justify-between">
          <div>
            <div className="font-bold text-[18px]">AAGS Petrole et Gaz</div>
            <div className="mt-2">
              <div>Adresse: Immeuble CTC, Av Wagenya n°8778,</div>
              <div>5eme etage, App 501, Kinshasa/Gombe</div>
            </div>
            <div className="mt-2">N° Impôt : A2441781R</div>
          </div>
          <div className="text-right">
            <div className="uppercase tracking-widest text-neutral-400 font-semibold">FACTURE<br/>PROFORMA</div>
            <div className="mt-1 text-xs text-neutral-500">N° {proformaNumber}</div>
            <div className="mt-10">Kinshasa {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-8">
          <div>
            <div className="font-semibold">PROFORMA À :</div>
            <div className="mt-1"><span className="font-semibold">Nom de le société</span> : {(clients.find((c) => c.id === clientId)?.name) || ""}</div>
            <div><span className="font-semibold">Adresse</span>:</div>
          </div>
          <div>
            <div><span className="font-semibold">RCCM:</span></div>
            <div><span className="font-semibold">Id Nat:</span></div>
            <div><span className="font-semibold">NIF:</span></div>
            <div><span className="font-semibold">Bon de Commande :</span></div>
            <div><span className="font-semibold">Validité de l'offre:</span> 30 Jours</div>
          </div>
        </div>

        <div className="text-center font-semibold mt-8">N° PROFORMA {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }).replace(/\//g, "-")}</div>

        <table className="proforma-table w-full mt-4 text-[11px]">
          <thead>
            <tr className="bg-neutral-100">
              <th className="py-2 w-10">#</th>
              <th>PRODUIT</th>
              <th className="w-28">QTY (M3)</th>
              <th className="w-36">P.U (USD/M3)</th>
              <th className="w-44">PRIX TOTAL (USD)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-center">1</td>
              <td className="py-3">
                Carburant (Delivered Duty Unpaid)
                <div className="text-[11px] text-neutral-500">DDU</div>
              </td>
              <td className="text-center">{Number(quantityM3 || 0)}</td>
              <td className="text-center">{Number(totalDDUUSD || 0).toLocaleString("fr-FR", { minimumFractionDigits: 1 })}</td>
              <td className="text-right pr-2">{Number(lineTotalDDU || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td colSpan={4} className="text-right pr-2">&nbsp;</td>
              <td className="text-right pr-2">-</td>
            </tr>
            <tr>
              <td colSpan={4} className="text-right pr-2">&nbsp;</td>
              <td className="text-right pr-2">-</td>
            </tr>
            <tr>
              <td colSpan={4} className="text-right pr-2">TVA 16%</td>
              <td className="text-right pr-2">{tvaApplicable ? (Number(lineTotalDDU || 0) * 0.16).toLocaleString("fr-FR", { minimumFractionDigits: 2 }) : "-"}</td>
            </tr>
            <tr>
              <td colSpan={4} className="text-right pr-2 font-semibold">Total</td>
              <td className="text-right pr-2 font-semibold">{(Number(lineTotalDDU || 0) + (tvaApplicable ? Number(lineTotalDDU || 0) * 0.16 : 0)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
        <div className="mt-6 text-sm italic text-neutral-700">Le prix indiqué dans le présent devis est fourni à titre indicatif et est susceptible d’être révisé en fonction des fluctuations et de l’évolution du marché.</div>
        <div className="mt-12 text-sm">NOUS VOUS REMERCIONS DE VOTRE CONFIANCE.</div>
        <div className="mt-2 text-sm"><span className="font-semibold">Montant en lettres:</span> {amountToWordsFR(totalDDU_TTC)}</div>
        <div className="mt-16 flex justify-end pr-10">
          <div className="text-center">
            {signatureDataUrl ? (
              <div className="mb-2">
                <img src={signatureDataUrl} alt="Signature" className="h-16 object-contain" />
              </div>
            ) : (
              <div className="mb-16 opacity-70">Signature</div>
            )}
            <div className="text-[11px]">{session?.user?.name || ""}</div>
          </div>
        </div>
      </div>
    </div>
  );
}


