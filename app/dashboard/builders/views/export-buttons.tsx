"use client";

import { Button } from "@/components/ui/button";

export default function ExportButtons({ item }: { item: any }) {
  function numberFr(n?: number | null) {
    if (typeof n !== "number") return "-";
    return n.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  }

  function buildTableHTML() {
    const dateStr = new Date(item.date).toLocaleDateString("fr-FR");
    const title = `${item.title ?? "COST BUILD UP"} — ${dateStr}`;
    const html = `
      <html>
        <head>
          <meta charset=\"utf-8\" />
          <style>
            body { font-family: Arial, sans-serif; }
            h2 { text-align:center; margin: 0 0 12px; }
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #333; padding: 6px 8px; }
            thead th { background: #f2f2f2; }
            .section { background: #fff7cc; font-weight: bold; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class=\"right\">USD/M3</th>
              </tr>
            </thead>
            <tbody>
              <tr class=\"section\"><td>COÛTS DE BASE DU PRODUIT & TRANSPORT INITIAL</td><td></td></tr>
              <tr><td>Platt's or FOB</td><td class=\"right\">${numberFr(item.baseCosts?.plattsFOBUSD)}</td></tr>
              <tr><td>Transport (camion)</td><td class=\"right\">${numberFr(item.baseCosts?.truckTransportUSD)}</td></tr>
              <tr><td>Brut C&F</td><td class=\"right\">${numberFr(item.baseCosts?.brutCFUSD)}</td></tr>
              <tr><td>Agency/Trade Sec/Customs</td><td class=\"right\">${numberFr(item.baseCosts?.agencyCustomsUSD)}</td></tr>
              <tr class=\"section\"><td>A. Prix de revient</td><td class=\"right\">${numberFr(item.baseCosts?.acquisitionCostUSD)}</td></tr>

              <tr class=\"section\"><td>COÛTS & MARGE DU FOURNISSEUR POUR L'OFFRE DDU</td><td></td></tr>
              <tr><td>Frais stockage/hospitality</td><td class=\"right\">${numberFr(item.supplierDDU?.storageHospitalityUSD)}</td></tr>
              <tr><td>ANR-Déchargement</td><td class=\"right\">${numberFr(item.supplierDDU?.anrDechargementUSD)}</td></tr>
              <tr><td>Marge du Fournisseur</td><td class=\"right\">${numberFr(item.supplierDDU?.supplierMarginUSD)}</td></tr>
              <tr class=\"section\"><td>PRIX DE VENTE DDU</td><td class=\"right\">${numberFr(item.supplierDDU?.sellingPriceDDUUSD)}</td></tr>

              <tr class=\"section\"><td>COÛTS COLLECTÉS PAR LA DOUANE</td><td></td></tr>
              <tr><td>Douane</td><td class=\"right\">${numberFr(item.customs?.customsDutyUSD)}</td></tr>
              <tr><td>TVA import</td><td class=\"right\">${numberFr(item.customs?.importVATUSD)}</td></tr>
              <tr class=\"section\"><td>Total Douanes</td><td class=\"right\">${numberFr(item.customs?.subtotalUSD)}</td></tr>

              <tr class=\"section\"><td>Redevances (Levies)</td><td></td></tr>
              <tr><td>FONER</td><td class=\"right\">${numberFr(item.levies?.fonerUSD)}</td></tr>
              <tr><td>Stock Séc. / Moléculaire</td><td class=\"right\">${numberFr(item.levies?.molecularMarkingOrStockUSD)}</td></tr>
              <tr><td>Reconstruction & Stratégique</td><td class=\"right\">${numberFr(item.levies?.reconstructionStrategicUSD)}</td></tr>
              <tr><td>Intervention Éco. & Autres</td><td class=\"right\">${numberFr(item.levies?.economicInterventionUSD)}</td></tr>
              <tr class=\"section\"><td>Total Redevances</td><td class=\"right\">${numberFr(item.levies?.totalLeviesUSD)}</td></tr>

              <tr class=\"section\"><td>COÛTS DE TRANSPORT ADDITIONNELS</td><td></td></tr>
              <tr><td>Freight to Mine</td><td class=\"right\">${numberFr(item.transport?.freightToMineUSD)}</td></tr>
              <tr><td>Pertes (L/camion)</td><td class=\"right\">${numberFr(item.transport?.lossesLitresPerTruck)}</td></tr>
              <tr class=\"section\"><td>Total transport final</td><td class=\"right\">${numberFr(item.transport?.totalTransportFinalUSD)}</td></tr>

              <tr class=\"section\"><td>PRIX DE VENTE DDP</td><td class=\"right\">${numberFr(item.totals?.priceDDPUSD)}</td></tr>
            </tbody>
          </table>
        </body>
      </html>`;
    return html;
  }

  function exportExcel() {
    const html = buildTableHTML();
    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const base = String(item?.title ?? "builder").replace(/[^\p{L}\p{N}_-]+/gu, "_");
    a.download = `${base}_${new Date(item.date).toISOString().slice(0,10)}.xls`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportPDF() {
    const html = buildTableHTML();
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


