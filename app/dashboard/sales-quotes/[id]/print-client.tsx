"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

interface PrintClientProps {
  proformaNumber?: string | null;
  clientName?: string | null;
  clientAddress?: string | null;
  clientRccm?: string | null;
  clientIdNat?: string | null;
  clientNif?: string | null;
  totalDDUUSD?: number | null;
  totalDDPUSD?: number | null;
  tvaApplicable?: boolean | null;
}

export default function PrintClient({ proformaNumber, clientName, clientAddress, clientRccm, clientIdNat, clientNif, totalDDUUSD, totalDDPUSD, tvaApplicable }: PrintClientProps) {
  const [quantityM3, setQuantityM3] = useState<number>(1);

  const lineTotalDDP = useMemo(() => Number(totalDDPUSD || 0) * Number(quantityM3 || 0), [totalDDPUSD, quantityM3]);
  const lineTotalDDU = useMemo(() => Number(totalDDUUSD || 0) * Number(quantityM3 || 0), [totalDDUUSD, quantityM3]);

  const triggerPrint = (mode: "ddp" | "ddu") => {
    const cls = mode === "ddp" ? "print-ddp" : "print-ddu";
    document.body.classList.add(cls);
    setTimeout(() => {
      window.print();
      setTimeout(() => document.body.classList.remove(cls), 100);
    }, 150);
  };

  // Lazy-load helpers for PDF download without adding dependencies
  const loadScript = (src: string) => new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(s);
  });

  const downloadPdf = async (mode: "ddp" | "ddu") => {
    const targetSelector = mode === "ddp" ? ".proforma-print-ddp" : ".proforma-print-ddu";
    const target = document.querySelector(targetSelector) as HTMLElement | null;
    if (!target) return;

    // Ensure target is visible for rendering
    const cleanup: Array<() => void> = [];
    const prevVisibility = target.style.visibility;
    const prevDisplay = target.style.display;
    target.style.visibility = "visible";
    target.style.display = "block";
    cleanup.push(() => { target.style.visibility = prevVisibility; target.style.display = prevDisplay; });

    try {
      // Load html2canvas and jsPDF from CDN
      interface WindowWithLibs extends Window {
        html2canvas?: (el: HTMLElement, opts?: { scale?: number; backgroundColor?: string; useCORS?: boolean }) => Promise<HTMLCanvasElement>;
        jspdf?: { jsPDF: new (orientation?: string, unit?: string, format?: string) => {
          addImage: (imgData: string, format: string, x: number, y: number, w: number, h: number, alias?: string, compression?: string) => void;
          addPage: () => void;
          save: (filename: string) => void;
        } };
      }
      const win = window as WindowWithLibs;
      
      if (!win.html2canvas) {
        await loadScript("https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js");
      }
      if (!win.jspdf) {
        await loadScript("https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js");
      }

      if (!win.html2canvas || !win.jspdf) {
        throw new Error("Failed to load required libraries");
      }

      const html2canvas = win.html2canvas;
      const { jsPDF } = win.jspdf;

      const canvas = await html2canvas(target, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth - 20; // margins
      const imgHeight = canvas.height * imgWidth / canvas.width;
      const y = 10;

      if (imgHeight <= pageHeight - 20) {
        pdf.addImage(imgData, "PNG", 10, y, imgWidth, imgHeight, undefined, "FAST");
      } else {
        // paginate
        let remainingHeight = imgHeight;
        const pageCanvas = document.createElement("canvas");
        const ctx = pageCanvas.getContext("2d");
        const ratio = imgWidth / canvas.width;
        pageCanvas.width = canvas.width;
        const pagePixelHeight = (pageHeight - 20) / ratio;
        pageCanvas.height = Math.floor(pagePixelHeight);

        let sY = 0;
        while (remainingHeight > 0 && ctx) {
          ctx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(canvas, 0, sY, pageCanvas.width, pageCanvas.height, 0, 0, pageCanvas.width, pageCanvas.height);
          const pageImg = pageCanvas.toDataURL("image/png");
          if (sY === 0) {
            pdf.addImage(pageImg, "PNG", 10, y, imgWidth, pageHeight - 20, undefined, "FAST");
          } else {
            pdf.addPage();
            pdf.addImage(pageImg, "PNG", 10, 10, imgWidth, pageHeight - 20, undefined, "FAST");
          }
          remainingHeight -= (pageHeight - 20);
          sY += pageCanvas.height;
        }
      }

      const filename = `proforma-${mode}-${(proformaNumber || "").toString() || "doc"}.pdf`;
      pdf.save(filename);
    } catch (_) {
      // Fallback: trigger native print
      triggerPrint(mode);
    } finally {
      cleanup.forEach((fn) => fn());
    }
  };

  const amountToWordsFR = (value: number): string => {
    const underTwenty = ["zéro","un","deux","trois","quatre","cinq","six","sept","huit","neuf","dix","onze","douze","treize","quatorze","quinze","seize","dix-sept","dix-huit","dix-neuf"];
    const tens = ["","","vingt","trente","quarante","cinquante","soixante","soixante-dix","quatre-vingt","quatre-vingt-dix"];
    const underHundred = (n: number) => {
      if (n < 20) return underTwenty[n];
      const t = Math.floor(n / 10), u = n % 10;
      if (t === 7 || t === 9) return tens[t - 1] + (u ? "-" + underTwenty[10 + u] : "");
      if (t === 8 && u === 0) return "quatre-vingts";
      return tens[t] + (u ? (t === 8 ? "-" : "-") + underTwenty[u] : "");
    };
    const underThousand = (n: number) => {
      if (n < 100) return underHundred(n);
      const h = Math.floor(n / 100), r = n % 100;
      const hStr = h === 1 ? "cent" : underTwenty[h] + " cent" + (r === 0 ? "s" : "");
      return hStr + (r ? " " + underHundred(r) : "");
    };
    const scale = (n: number, unit: number, one: string, many: string) => {
      const q = Math.floor(n / unit);
      const r = n % unit;
      if (!q) return { head: "", rest: n };
      const qStr = q === 1 ? `un ${one}` : `${underThousand(q)} ${many}`;
      return { head: qStr, rest: r };
    };
    const parts: string[] = [];
    let rest = value;
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
    const euros = Math.floor(value);
    const cents = Math.round((value - euros) * 100);
    const sign = value < 0 ? "moins " : "";
    const eStr = parts.join(" ").replace(/\s+/g, " ").trim() || underTwenty[0];
    const cStr = cents ? " et " + underHundred(cents) + " cents" : "";
    return `${sign}${eStr} dollars américains${cStr}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div>
          <div className="text-sm text-muted-foreground">QTY (M³)</div>
          <input className="h-9 w-32 border rounded px-2" type="number" step="1" value={quantityM3} onChange={(e) => setQuantityM3(Number(e.target.value || 0))} />
        </div>
        <div className="ml-auto flex gap-2">
          <Button onClick={() => triggerPrint("ddp")}>Imprimer DDP</Button>
          <Button variant="secondary" onClick={() => triggerPrint("ddu")}>Imprimer DDU</Button>
          <Button variant="outline" onClick={() => downloadPdf("ddp")}>Télécharger PDF DDP</Button>
          <Button variant="outline" onClick={() => downloadPdf("ddu")}>Télécharger PDF DDU</Button>
        </div>
      </div>

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
            <div className="mt-1 text-xs text-neutral-500">N° {proformaNumber || "—"}</div>
            <div className="mt-10">Kinshasa {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-8">
          <div>
            <div className="font-semibold">PROFORMA À :</div>
            <div className="mt-1"><span className="font-semibold">Société</span> : {clientName || ""}</div>
            <div><span className="font-semibold">Adresse</span> : {clientAddress || ""}</div>
          </div>
          <div>
            <div><span className="font-semibold">RCCM:</span> {clientRccm || ""}</div>
            <div><span className="font-semibold">ID NAT:</span> {clientIdNat || ""}</div>
            <div><span className="font-semibold">NIF:</span> {clientNif || ""}</div>
            <div><span className="font-semibold">Bon de Commande :</span></div>
            <div><span className="font-semibold">Validité de l&apos;offre:</span> 30 Jours</div>
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
        <div className="mt-2 text-sm"><span className="font-semibold">Montant en lettres:</span> {amountToWordsFR(Number(lineTotalDDP || 0) + (tvaApplicable ? Number(lineTotalDDP || 0) * 0.16 : 0))}</div>
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
            <div className="mt-1 text-xs text-neutral-500">N° {proformaNumber || "—"}</div>
            <div className="mt-10">Kinshasa {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mt-8">
          <div>
            <div className="font-semibold">PROFORMA À :</div>
            <div className="mt-1"><span className="font-semibold">Société</span> : {clientName || ""}</div>
            <div><span className="font-semibold">Adresse</span> : {clientAddress || ""}</div>
          </div>
          <div>
            <div><span className="font-semibold">RCCM:</span> {clientRccm || ""}</div>
            <div><span className="font-semibold">ID NAT:</span> {clientIdNat || ""}</div>
            <div><span className="font-semibold">NIF:</span> {clientNif || ""}</div>
            <div><span className="font-semibold">Bon de Commande :</span></div>
            <div><span className="font-semibold">Validité de l&apos;offre:</span> 30 Jours</div>
          </div>
          <div>
            <div className="font-semibold">PROFORMA À :</div>
            <div className="mt-1"><span className="font-semibold">Société</span> : {clientName || ""}</div>
            <div><span className="font-semibold">Adresse</span> : {clientAddress || ""}</div>
          </div>
          <div>
            <div><span className="font-semibold">RCCM:</span> {clientRccm || ""}</div>
            <div><span className="font-semibold">ID NAT:</span> {clientIdNat || ""}</div>
            <div><span className="font-semibold">NIF:</span> {clientNif || ""}</div>
            <div><span className="font-semibold">Bon de Commande :</span></div>
            <div><span className="font-semibold">Validité de l&apos;offre:</span> 30 Jours</div>
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
      </div>
    </div>
  );
}


