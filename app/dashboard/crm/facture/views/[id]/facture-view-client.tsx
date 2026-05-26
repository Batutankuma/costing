"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ManualFacture } from "@/models/mvc";
import type { ManualFactureModuleConfig } from "@/lib/manual-facture-config";
import { Badge } from "@/components/ui/badge";
import QRCode from "react-qr-code";
import { ArrowLeft, Printer } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Informations de la société (codées en dur)
const COMPANY_INFO = {
  name: "AAGS Petrole et Gaz",
  fullName: "AAGS PETROLE ET GAZ SARLU",
  address: "Immeuble CTC, Av Wagenya n°8778, 5ème étage, App 501, Kinshasa/Gombe",
  taxNumber: "A2441781R",
  rccm: "CD/KNG/RCCM/24-B-04493",
  idNat: "01-B0500-N55496H",
  phone1: "+243 99 26 96 253",
  phone2: "+243 808 472 427",
  email: "info@aagspg.com",
  slogan: "L'Energie qui propulse votre entreprise.",
  bankAccounts: {
    bofiCdf: "00031-26100-40044491012-71",
    bofiUsd: "00031-26110-40044491011-21",
    rawBankCdf: "05100-05101-01125487002-44",
    rawBankUsd: "05100-05101-01125487001-47",
    boaUsd: "00029-01017-03103860005-84",
  },
  siegeSocial: "Immeuble CTC, Avenue Wagenia nº 8778, 5ème étage, Appt 501. Kinshasa/Gombe, République Démocratique du Congo",
  siegeExploitation: "Aéroport de Kalemie Province de Tanganyika",
};

// Fonction pour convertir le montant en lettres (français)
const numberToWordsFR = (n: number): string => {
  const units = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize"];
  const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];
  const underHundred = (num: number): string => {
    if (num < 17) return units[num];
    if (num < 20) return "dix-" + units[num - 10];
    if (num < 70) {
      const d = Math.floor(num / 10),
        u = num % 10;
      if (u === 0) return tens[d];
      if (u === 1 && (d === 2 || d === 3 || d === 4 || d === 5)) return tens[d] + " et un";
      return tens[d] + "-" + units[u];
    }
    if (num < 80) return "soixante-" + underHundred(num - 60);
    if (num === 80) return "quatre-vingts";
    return "quatre-vingt-" + underHundred(num - 80);
  };
  const underThousand = (num: number): string => {
    if (num < 100) return underHundred(num);
    const h = Math.floor(num / 100),
      r = num % 100;
    if (h === 1) return "cent" + (r ? " " + underHundred(r) : "");
    return units[h] + " cent" + (r ? " " + underHundred(r) : "s");
  };
  const scale = (num: number, base: number, labelSing: string, labelPl: string) => {
    const q = Math.floor(num / base),
      r = num % base;
    if (!q) return { head: "", rest: r };
    const lbl = q > 1 ? labelPl : labelSing;
    return { head: (q === 1 && base === 1000 ? "mille" : numberToWordsFR(q) + " " + lbl), rest: r };
  };
  if (n === 0) return units[0];
  const parts: string[] = [];
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

const amountToWordsFR = (value: number, currency: string = "USD"): string => {
  const dollars = Math.floor(value);
  const cents = Math.round((value - dollars) * 100);
  const dStr = numberToWordsFR(Math.abs(dollars));
  const cStr = numberToWordsFR(Math.abs(cents));
  const sign = value < 0 ? "moins " : "";
  const currencyText = currency === "USD" ? "dollars américains" : currency;
  return `${sign}${dStr} ${currencyText}${cents ? " et " + cStr + " cents" : ""}`;
};

interface FactureViewClientProps {
  factureId: string;
  config: ManualFactureModuleConfig;
  findFactureById: (id: string) => Promise<{
    success: boolean;
    result?: ManualFacture;
    failure?: string;
  }>;
}

export default function FactureViewClient({ factureId, config, findFactureById }: FactureViewClientProps) {
  const router = useRouter();
  const [facture, setFacture] = useState<ManualFacture | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const result = await findFactureById(factureId);
      if (!result.success || !result.result) {
        router.push(config.basePath);
        return;
      }
      setFacture(result.result);
      setLoading(false);
    })();
  }, [factureId, router, config.basePath, findFactureById]);

  if (loading || !facture) {
    return (
      <div className="p-6">
        <p>Chargement de la facture...</p>
      </div>
    );
  }

  const formattedDate = format(facture.invoiceDate, "d MMMM yyyy", { locale: fr });
  const dueDate = format(new Date(facture.invoiceDate.getTime() + facture.dueInDays * 86400000), "d MMMM yyyy", { locale: fr });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            document.body.classList.add("print-facture");
            setTimeout(() => {
              window.print();
              setTimeout(() => document.body.classList.remove("print-facture"), 100);
            }, 150);
          }}
          className="gap-2"
        >
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">{config.documentLabel} {facture.invoiceNumber}</CardTitle>
            <CardDescription>Émise le {formattedDate} • Échéance {dueDate}</CardDescription>
          </div>
          <QRCode value={facture.invoiceNumber} size={96} />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-sm uppercase text-muted-foreground">Vendeur</h3>
              <p className="font-semibold">{facture.vendorName}</p>
              {facture.vendorAddress && <p className="text-sm text-muted-foreground whitespace-pre-line">{facture.vendorAddress}</p>}
              {facture.vendorTaxNumber && (
                <p className="text-sm">
                  <span className="font-medium">N° Impôt:</span> {facture.vendorTaxNumber}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-sm uppercase text-muted-foreground">Client</h3>
              <p className="font-semibold">{facture.clientName}</p>
              {facture.clientAddress && <p className="text-sm text-muted-foreground whitespace-pre-line">{facture.clientAddress}</p>}
              {facture.clientTaxNumber && (
                <p className="text-sm">
                  <span className="font-medium">N° Client:</span> {facture.clientTaxNumber}
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="text-sm flex gap-4 flex-wrap">
              <Badge variant="outline">Devise: {facture.currency}</Badge>
              {facture.purchaseOrder && <Badge variant="outline">Bon de commande: {facture.purchaseOrder}</Badge>}
              <Badge variant="outline">Échéance: {facture.dueInDays} jours</Badge>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-2 text-left">Description</th>
                  <th className="px-4 py-2 text-left">Unité</th>
                  <th className="px-4 py-2 text-right">Quantité</th>
                  <th className="px-4 py-2 text-right">Prix unitaire</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {facture.lines.map((line, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-4 py-2">{line.description}</td>
                    <td className="px-4 py-2">{line.unit}</td>
                    <td className="px-4 py-2 text-right">{line.quantity.toLocaleString("fr-FR")}</td>
                    <td className="px-4 py-2 text-right">
                      {line.unitPrice.toFixed(4)} {facture.currency}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {(line.quantity * line.unitPrice).toFixed(2)} {facture.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              {facture.notes && (
                <div className="space-y-2">
                  <h3 className="text-sm uppercase text-muted-foreground">Notes</h3>
                  <p className="text-sm whitespace-pre-line">{facture.notes}</p>
                </div>
              )}
            </div>
            <div className="space-y-2 bg-muted/40 rounded-lg p-4">
              <div className="flex justify-between">
                <span>Sous-total</span>
                <span>
                  {facture.subtotal.toFixed(2)} {facture.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span>TVA ({facture.taxRate}%)</span>
                <span>
                  {facture.taxAmount.toFixed(2)} {facture.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Autres</span>
                <span>
                  {facture.otherFees.toFixed(2)} {facture.currency}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total TTC</span>
                <span>
                  {facture.total.toFixed(2)} {facture.currency}
                </span>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Montant en lettres: <span className="italic">{amountToWordsFR(facture.total, facture.currency)}.</span>
          </div>
        </CardContent>
      </Card>

      {/* Styles pour l'impression */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background: #fff !important;
            margin: 0;
            padding: 0;
          }
          body * {
            visibility: hidden !important;
          }
          body.print-facture .facture-print,
          body.print-facture .facture-print * {
            visibility: visible !important;
          }
          .facture-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            min-height: 100vh;
            padding: 15mm 20mm;
            font-family: Arial, sans-serif;
            background: white;
            box-sizing: border-box;
          }
          .no-print {
            display: none !important;
          }
        }
        @media screen {
          .facture-print {
            display: none;
          }
          body.print-facture .facture-print {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 9999;
            background: white;
            overflow: auto;
            padding: 20px;
          }
        }
      `}</style>

      {/* PDF FACTURE - Modèle exact */}
      <div className="facture-print" style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", lineHeight: "1.4", color: "#000", width: "100%", padding: "0", boxSizing: "border-box" }}>
        {/* En-tête avec image */}
        <div style={{ width: "100%", marginBottom: "20px" }}>
          <Image src="/assets/tete.png" alt="En-tête AAGS" width={800} height={200} style={{ width: "100%", height: "auto", display: "block" }} />
        </div>

        {/* Contenu principal avec padding */}
        <div style={{ padding: "0 20mm 15mm 20mm" }}>

        {/* Informations société */}
        <div style={{ marginBottom: "15px", fontSize: "11px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "2px" }}>{COMPANY_INFO.name}</div>
          <div>Adresse: {COMPANY_INFO.address}</div>
          <div>N° Impôt : {COMPANY_INFO.taxNumber}</div>
        </div>

        {/* Numéro facture et date - même ligne */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ fontSize: "16px", fontWeight: "bold" }}>{config.printNumberLabel} {facture.invoiceNumber}</div>
          <div style={{ fontSize: "11px" }}>Kinshasa {format(facture.invoiceDate, "dd MMMM yyyy", { locale: fr })}</div>
        </div>

        {/* Section FACTURER À - Deux colonnes */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "20px" }}>
          <div>
            <div style={{ fontWeight: "bold", marginBottom: "8px", fontSize: "12px" }}>FACTURER À :</div>
            <div style={{ fontSize: "10px", lineHeight: "1.6" }}>
              <div><span style={{ fontWeight: "bold" }}>Nom de la société</span> : {facture.clientName}</div>
              {facture.clientAddress && <div><span style={{ fontWeight: "bold" }}>Adresse</span> : {facture.clientAddress}</div>}
              {facture.clientTaxNumber && <div><span style={{ fontWeight: "bold" }}>N° Impôt</span> : {facture.clientTaxNumber}</div>}
              {facture.purchaseOrder && <div><span style={{ fontWeight: "bold" }}>Bon de Commande</span> : {facture.purchaseOrder}</div>}
            </div>
          </div>
          <div style={{ fontSize: "10px" }}>
            <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: "bold" }}>Échéance:</span> {facture.dueInDays} jours</div>
          </div>
        </div>

        {/* Tableau des lignes */}
        <table style={{ width: "100%", fontSize: "10px", marginBottom: "15px", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th style={{ padding: "8px", textAlign: "center", border: "1px solid #333", fontWeight: "bold" }}>#</th>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #333", fontWeight: "bold" }}>DESCRIPTION / PRODUIT</th>
              <th style={{ padding: "8px", textAlign: "center", border: "1px solid #333", fontWeight: "bold" }}>UNITÉ</th>
              <th style={{ padding: "8px", textAlign: "center", border: "1px solid #333", fontWeight: "bold" }}>QTY</th>
              <th style={{ padding: "8px", textAlign: "center", border: "1px solid #333", fontWeight: "bold" }}>P.U Hors TVA</th>
              <th style={{ padding: "8px", textAlign: "right", border: "1px solid #333", fontWeight: "bold" }}>PRIX TOTAL ({facture.currency})</th>
            </tr>
          </thead>
          <tbody>
            {facture.lines.map((line, index) => {
              const lineTotal = line.quantity * line.unitPrice;
              return (
                <tr key={index}>
                  <td style={{ padding: "8px", textAlign: "center", border: "1px solid #333" }}>{index + 1}</td>
                  <td style={{ padding: "8px", border: "1px solid #333" }}>{line.description}</td>
                  <td style={{ padding: "8px", textAlign: "center", border: "1px solid #333" }}>{line.unit}</td>
                  <td style={{ padding: "8px", textAlign: "center", border: "1px solid #333" }}>{line.quantity.toLocaleString("fr-FR")}</td>
                  <td style={{ padding: "8px", textAlign: "center", border: "1px solid #333" }}>{line.unitPrice.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                  <td style={{ padding: "8px", textAlign: "right", border: "1px solid #333" }}>{lineTotal.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Section avec remerciement/montant à gauche et tableau de totaux à droite */}
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "30px" }}>
          {/* Colonne gauche - Texte de remerciement et montant */}
          <div style={{ flex: "1" }}>
            <div style={{ fontSize: "13px", fontWeight: "bold", fontStyle: "italic", marginBottom: "15px", textTransform: "uppercase" }}>
              NOUS VOUS REMERCIONS DE VOTRE CONFIANCE.
            </div>
            <div style={{ fontSize: "11px" }}>
              <span style={{ fontWeight: "bold" }}>Montant en lettre:</span> {amountToWordsFR(facture.total, facture.currency)}.
            </div>
          </div>

          {/* Colonne droite - Boîte de résumé */}
          <div style={{ border: "2px solid #333", padding: "12px", width: "240px", fontSize: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontWeight: "bold" }}>Total Hors TVA</span>
              <span style={{ fontWeight: "bold" }}>{facture.subtotal.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
            {facture.taxRate > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span>TVA</span>
                <span>{facture.taxAmount.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              </div>
            )}
            {facture.otherFees > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span>Autres</span>
                <span>{facture.otherFees.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #333", paddingTop: "8px", marginTop: "8px", fontSize: "14px", fontWeight: "bold" }}>
              <span>Total TTC</span>
              <span>{facture.total.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>

        {/* Section signature - QR Code et Sceau à gauche, Nom/Fonction/Signature à droite */}
        <div style={{ marginTop: "30px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          {/* Colonne gauche - QR Code et Sceau côte à côte */}
          <div style={{ flex: "1", paddingRight: "40px", display: "flex", alignItems: "flex-start", gap: "20px" }}>
            <div style={{ marginTop: "15px" }}>
              <div style={{ display: "inline-block", padding: "8px", backgroundColor: "white", border: "1px solid #ccc" }}>
                <QRCode value={facture.invoiceNumber} size={80} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
              </div>
            </div>
            {/* Sceau en grand à côté du QR Code */}
            <div style={{ marginTop: "15px" }}>
              <Image src="/assets/sc.png" alt="Sceau" width={120} height={120} style={{ maxHeight: "120px", height: "auto", width: "auto" }} />
            </div>
          </div>

          {/* Colonne droite - Signature, nom et fonction empilés verticalement */}
          <div style={{ flex: "1", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "15px" }}>
            {/* Signature agrandie en haut */}
            <div style={{ marginBottom: "10px" }}>
              <Image src="/assets/signature.png" alt="Signature" width={120} height={120} style={{ maxHeight: "120px", height: "auto", width: "auto" }} />
            </div>
            
            {/* Nom et fonction en dessous */}
            <div style={{ textAlign: "right", marginTop: "10px" }}>
              <div style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "4px" }}>SAEL BATUTA NKUMA</div>
              <div style={{ fontSize: "10px" }}>Contrôleur de gestion</div>
            </div>
          </div>
        </div>

        {/* Informations bancaires - Design compact en ligne */}
        <div style={{ marginTop: "15px", marginBottom: "20px" }}>
          <div style={{ fontSize: "9px", fontWeight: "bold", marginBottom: "8px", color: "#333" }}>INFORMATIONS BANCAIRES</div>
          <div style={{ display: "flex", gap: "6px", fontSize: "7px", flexWrap: "wrap" }}>
            {/* Raw Bank USD */}
            <div style={{ border: "1px solid #ddd", borderRadius: "3px", padding: "5px", backgroundColor: "#fafafa", flex: "1", minWidth: "0" }}>
              <div style={{ fontWeight: "bold", marginBottom: "3px", color: "#333", fontSize: "8px" }}>Raw Bank</div>
              <div style={{ marginBottom: "2px" }}><span style={{ fontWeight: "600" }}>D:</span> USD</div>
              <div style={{ marginBottom: "2px", wordBreak: "break-all" }}><span style={{ fontWeight: "600" }}>N°:</span> 5100-5101-1125487001-47</div>
              <div><span style={{ fontWeight: "600" }}>Swift:</span> RAWBCDKI</div>
            </div>
            {/* Raw Bank CDF */}
            <div style={{ border: "1px solid #ddd", borderRadius: "3px", padding: "5px", backgroundColor: "#fafafa", flex: "1", minWidth: "0" }}>
              <div style={{ fontWeight: "bold", marginBottom: "3px", color: "#333", fontSize: "8px" }}>Raw Bank</div>
              <div style={{ marginBottom: "2px" }}><span style={{ fontWeight: "600" }}>D:</span> CDF</div>
              <div style={{ marginBottom: "2px", wordBreak: "break-all" }}><span style={{ fontWeight: "600" }}>N°:</span> 5100-5101-1125487002-44</div>
              <div><span style={{ fontWeight: "600" }}>Swift:</span> RAWBCDKI</div>
            </div>
            {/* Bank of Africa USD */}
            <div style={{ border: "1px solid #ddd", borderRadius: "3px", padding: "5px", backgroundColor: "#fafafa", flex: "1", minWidth: "0" }}>
              <div style={{ fontWeight: "bold", marginBottom: "3px", color: "#333", fontSize: "8px" }}>Bank of Africa</div>
              <div style={{ marginBottom: "2px" }}><span style={{ fontWeight: "600" }}>D:</span> USD</div>
              <div style={{ marginBottom: "2px", wordBreak: "break-all" }}><span style={{ fontWeight: "600" }}>N°:</span> 00029-01017-03103860005-84</div>
              <div><span style={{ fontWeight: "600" }}>Swift:</span> AFRICDKSXXX</div>
            </div>
            {/* BGFIBank USD */}
            <div style={{ border: "1px solid #ddd", borderRadius: "3px", padding: "5px", backgroundColor: "#fafafa", flex: "1", minWidth: "0" }}>
              <div style={{ fontWeight: "bold", marginBottom: "3px", color: "#333", fontSize: "8px" }}>BGFIBank</div>
              <div style={{ marginBottom: "2px" }}><span style={{ fontWeight: "600" }}>D:</span> USD</div>
              <div style={{ marginBottom: "2px", wordBreak: "break-all" }}><span style={{ fontWeight: "600" }}>N°:</span> 00031-26110-40044491011-21</div>
              <div><span style={{ fontWeight: "600" }}>Swift:</span> BGFICDKI</div>
            </div>
            {/* BGFIBank CDF */}
            <div style={{ border: "1px solid #ddd", borderRadius: "3px", padding: "5px", backgroundColor: "#fafafa", flex: "1", minWidth: "0" }}>
              <div style={{ fontWeight: "bold", marginBottom: "3px", color: "#333", fontSize: "8px" }}>BGFIBank</div>
              <div style={{ marginBottom: "2px" }}><span style={{ fontWeight: "600" }}>D:</span> CDF</div>
              <div style={{ marginBottom: "2px", wordBreak: "break-all" }}><span style={{ fontWeight: "600" }}>N°:</span> 00031-26100-40044491012-71</div>
              <div><span style={{ fontWeight: "600" }}>Swift:</span> BGFICDKI</div>
            </div>
          </div>
        </div>

        {/* Footer avec image */}
        <div style={{ marginTop: "20px", width: "100%" }}>
          <Image src="/assets/bas.png" alt="Pied de page AAGS" width={800} height={200} style={{ width: "100%", height: "auto", display: "block" }} />
        </div>
        </div>
      </div>
    </div>
  );
}

