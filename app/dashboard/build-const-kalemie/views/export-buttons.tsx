"use client";

import { Button } from "@/components/ui/button";

export default function KalemieExportButtons({ item }: { item: any }) {
  function numberFr(n?: number | null) {
    if (typeof n !== "number") return "-";
    return n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  }

  function buildHtml() {
    const dateStr = item?.date ? new Date(item.date).toLocaleDateString("fr-FR") : "";
    const title = `${item?.title ?? "COST BUILD UP KALEMIE"} — ${dateStr}`;
    const customsSubtotal = (item?.customs?.customsDutyUSD ?? 0) + (item?.customs?.importVATUSD ?? 0);
    const leviesTotal = item?.levies?.totalLeviesUSD ?? 0;
    const freight = item?.transport?.freightToMineUSD ?? 0;
    const losses = item?.transport?.lossesLitresPerTruck ?? 0;
    const ddu = (item?.baseCosts?.acquisitionCostUSD ?? 0)
      + (item?.supplierDDU?.storageHospitalityUSD ?? 0)
      + (item?.supplierDDU?.anrDechargementUSD ?? 0)
      + (item?.supplierDDU?.supplierMarginUSD ?? 0)
      + freight + losses;
    const ddp = ddu + customsSubtotal + leviesTotal;

    const html = `<!doctype html><html><head><meta charset="utf-8" />
      <style>
        body{font-family:Arial,sans-serif}
        h2{margin:0 0 12px;text-align:center}
        table{border-collapse:collapse;width:100%;font-size:12px}
        th,td{border:1px solid #9ca3af;padding:6px}
        th:first-child,td:first-child{text-align:left}
        th:last-child,td:last-child{text-align:right}
        .sec{background:#f4f4f5;font-weight:bold}
        .a{background:#fff3b0;font-weight:bold}
        .b{background:#dbeafe;font-weight:bold}
        .c{background:#e9d5ff;font-weight:bold}
        .g{background:#dcfce7;font-weight:bold}
      </style></head><body>
      <h2>${title}</h2>
      <table>
        <tr><th>Description</th><th>USD/M3</th></tr>
        <tr class='sec'><td>COÛTS DE BASE DU PRODUIT & TRANSPORT INITIAL</td><td></td></tr>
        <tr><td>Platt's or FOB</td><td>${numberFr(item?.baseCosts?.plattsFOBUSD)}</td></tr>
        <tr><td>Transport (camion)</td><td>${numberFr(item?.baseCosts?.truckTransportUSD)}</td></tr>
        <tr><td>Brut C&F</td><td>${numberFr(item?.baseCosts?.brutCFUSD)}</td></tr>
        <tr><td>Agency/Trade Sce/Customs</td><td>${numberFr(item?.baseCosts?.agencyCustomsUSD)}</td></tr>
        <tr class='a'><td>A. Prix de revient</td><td>${numberFr(item?.baseCosts?.acquisitionCostUSD)}</td></tr>

        <tr class='sec'><td>COÛTS & MARGE DU FOURNISSEUR POUR L'OFFRE DDU</td><td></td></tr>
        <tr><td>Frais stockage/hospitality</td><td>${numberFr(item?.supplierDDU?.storageHospitalityUSD)}</td></tr>
        <tr><td>ANR-Déchargement</td><td>${numberFr(item?.supplierDDU?.anrDechargementUSD)}</td></tr>
        <tr><td>Marge du Fournisseur</td><td>${numberFr(item?.supplierDDU?.supplierMarginUSD)}</td></tr>

        <tr class='sec'><td>COÛTS COLLECTÉS PAR LA DOUANE (B)</td><td></td></tr>
        <tr><td>Douane</td><td>${numberFr(item?.customs?.customsDutyUSD)}</td></tr>
        <tr><td>TVA import</td><td>${numberFr(item?.customs?.importVATUSD)}</td></tr>
        <tr class='b'><td>Total B</td><td>${numberFr(customsSubtotal)}</td></tr>

        <tr class='sec'><td>C. Total Redevances (Levies) Collectées par la Douane</td><td></td></tr>
        <tr><td>Total C</td><td>${numberFr(leviesTotal)}</td></tr>

        <tr class='sec'><td>COÛTS DE TRANSPORT ADDITIONNELS</td><td></td></tr>
        <tr><td>Freight to Mine</td><td>${numberFr(freight)}</td></tr>
        <tr><td>Pertes (300 L)</td><td>${numberFr(losses)}</td></tr>
        <tr class='a'><td>Prix de vente DDU (auto)</td><td>${numberFr(ddu)}</td></tr>

        <tr class='g'><td>PRIX DE VENTE DDP (auto)</td><td>${numberFr(ddp)}</td></tr>
      </table>
      </body></html>`;
    return html;
  }

  function exportExcel() {
    const html = buildHtml();
    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const base = String(item?.title ?? "kalemie").replace(/[^\p{L}\p{N}_-]+/gu, "_");
    a.download = `${base}_${new Date().toISOString().slice(0,10)}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    const html = buildHtml();
    const w = window.open("", "_blank", "width=1024,height=768");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.print(); w.close(); }, 300);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={exportExcel}>Exporter Excel</Button>
      <Button variant="outline" onClick={exportPDF}>Exporter PDF</Button>
    </div>
  );
}


