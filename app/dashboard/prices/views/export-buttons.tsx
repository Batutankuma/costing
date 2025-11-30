"use client";

import { Button } from "@/components/ui/button";

export default function ExportButtons({ item }: { item: any }) {
  function numberFr(n?: number | null) {
    if (typeof n !== "number") return "-";
    return n.toLocaleString("fr-FR");
  }

  const societeLabel = (val?: string) => {
    switch (val) {
      case "SOCIETE_MINE":
        return "Société minière";
      case "SOCIETE_AUTRE":
        return "Autre société";
      default:
        return val ?? "-";
    }
  };

  const cardinaleLabel = (val?: string) => {
    switch (val) {
      case "SUD":
        return "Sud";
      case "NORD":
        return "Nord";
      case "EST":
        return "Est";
      case "OUEST":
        return "Ouest";
      default:
        return val ?? "-";
    }
  };

  function buildTableHTML() {
    const rate = item?.exchangeRate?.rate ?? 0;
    const dateStr = new Date(item.date).toLocaleDateString("fr-FR");
    const title = `${item?.nomStructure ?? "Structure"} — ${dateStr}`;
    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; }
            h2 { text-align:center; margin: 0 0 12px; }
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #333; padding: 6px 8px; }
            thead th { background: #f2f2f2; }
            .section { background: #fff7cc; font-weight: bold; }
            .right { text-align: right; }
            .meta { margin: 8px 0 12px; }
            .meta td { border: none; padding: 2px 4px; }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          <table class="meta">
            <tr>
              <td><strong>Structure de société:</strong></td>
              <td>${societeLabel(item?.structureSociete)}</td>
              <td><strong>Cardinale:</strong></td>
              <td>${cardinaleLabel(item?.cardinale)}</td>
              <td><strong>Taux:</strong></td>
              <td class="right">${numberFr(rate)}</td>
            </tr>
          </table>
          <table>
            <thead>
              <tr>
                <th>Composante</th>
                <th class="right">Valeur CDF</th>
                <th class="right">Valeur (USD)</th>
              </tr>
            </thead>
            <tbody>
              <tr class="section"><td>P.M.F. Commercial (PMFC)</td><td class="right">${numberFr(item.pmfCommercialCDF)}</td><td class="right">${numberFr(item.pmfCommercialUSD)}</td></tr>
              <tr><td>1. Charges d'exploitation logisticiens (Frais d'entrepôt)</td><td class="right">${numberFr(item.logisticsCosts?.warehouseFee)}</td><td class="right">${numberFr((item.logisticsCosts?.warehouseFee ?? 0) / rate)}</td></tr>
              <tr class="section"><td>Total frais des sociétés de logistiques</td><td class="right">${numberFr(item.logisticsCosts?.total)}</td><td class="right">${numberFr((item.logisticsCosts?.total ?? 0) / rate)}</td></tr>
              <tr><td>2. Charges d'exploitation SOC. Com.</td><td class="right">${numberFr(item.commercialCosts?.socComFee)}</td><td class="right">${numberFr((item.commercialCosts?.socComFee ?? 0) / rate)}</td></tr>
              <tr><td>3. Marges Sociétés commerciales (10% PMF)</td><td class="right">${numberFr(item.commercialCosts?.margin)}</td><td class="right">${numberFr((item.commercialCosts?.margin ?? 0) / rate)}</td></tr>
              <tr class="section"><td>Total frais des sociétés commerciales</td><td class="right">${numberFr(item.commercialCosts?.total)}</td><td class="right">${numberFr((item.commercialCosts?.total ?? 0) / rate)}</td></tr>
              <tr><td>4. Stock de securite 1</td><td class="right">${numberFr(item.parafiscality?.stockSecurity1)}</td><td class="right">${numberFr((item.parafiscality?.stockSecurity1 ?? 0) / rate)}</td></tr>
              <tr><td>5. Stock de securite 2</td><td class="right">${numberFr(item.parafiscality?.stockSecurity2)}</td><td class="right">${numberFr((item.parafiscality?.stockSecurity2 ?? 0) / rate)}</td></tr>
              <tr><td>6. Marquage moléculaire</td><td class="right">${numberFr(item.parafiscality?.molecularMarking)}</td><td class="right">${numberFr((item.parafiscality?.molecularMarking ?? 0) / rate)}</td></tr>
              <tr><td>7. FONER</td><td class="right">${numberFr(item.parafiscality?.foner)}</td><td class="right">${numberFr((item.parafiscality?.foner ?? 0) / rate)}</td></tr>
              <tr><td>8. Effort de reconstruction & Stock Stratégique</td><td class="right">${numberFr(item.parafiscality?.reconstructionEffort)}</td><td class="right">${numberFr((item.parafiscality?.reconstructionEffort ?? 0) / rate)}</td></tr>
              <tr><td>9. Intervention Économique & Autres</td><td class="right">${numberFr(item.parafiscality?.intervention)}</td><td class="right">${numberFr((item.parafiscality?.intervention ?? 0) / rate)}</td></tr>
              <tr class="section"><td>10. Total Parafiscalité</td><td class="right">${numberFr(item.parafiscality?.total)}</td><td class="right">${numberFr((item.parafiscality?.total ?? 0) / rate)}</td></tr>
              <tr><td>11. TVA à la vente (TVAV) pour calcul</td><td class="right">${numberFr(item.fiscality?.venteVAT)}</td><td class="right">${numberFr((item.fiscality?.venteVAT ?? 0) / rate)}</td></tr>
              <tr><td>12. Droits de Douane (10% PMF Commercial)</td><td class="right">${numberFr(item.fiscality?.customsDuty)}</td><td class="right">${numberFr((item.fiscality?.customsDuty ?? 0) / rate)}</td></tr>
              <tr><td>13. Droits de Consommation</td><td class="right">${numberFr(item.fiscality?.consumptionDuty)}</td><td class="right">${numberFr((item.fiscality?.consumptionDuty ?? 0) / rate)}</td></tr>
              <tr><td>14. TVA à l'importation</td><td class="right">${numberFr(item.fiscality?.importVAT)}</td><td class="right">${numberFr((item.fiscality?.importVAT ?? 0) / rate)}</td></tr>
              <tr class="section"><td>Total Fiscalité 1 (12+13+14)</td><td class="right">${numberFr(item.fiscality?.total1)}</td><td class="right">${numberFr((item.fiscality?.total1 ?? 0) / rate)}</td></tr>
              <tr><td>15. TVA nette à l'intérieur (TVAIR+TVAV-TVAI)</td><td class="right">${numberFr(item.fiscality?.netVAT)}</td><td class="right">${numberFr((item.fiscality?.netVAT ?? 0) / rate)}</td></tr>
              <tr class="section"><td>Total Fiscalité 2 (A+B+C+D+E)</td><td class="right">${numberFr(item.fiscality?.total2)}</td><td class="right">${numberFr((item.fiscality?.total2 ?? 0) / rate)}</td></tr>
              <tr><td>Prix de référence en CDF / M3</td><td class="right">${numberFr(item.priceRefCDF)}</td><td class="right">-</td></tr>
              <tr><td>Prix de référence en USD / M3</td><td class="right">-</td><td class="right">${numberFr(item.priceRefUSD)}</td></tr>
              <tr><td>Prix de référence à appliquer (USD/Litre)</td><td class="right">-</td><td class="right">${numberFr(item.priceRefUSDPerLitre)}</td></tr>
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
    const base = String(item?.nomStructure ?? "structure").replace(/[^\p{L}\p{N}_-]+/gu, "_");
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
    // Laisser le temps de peindre
    setTimeout(() => {
      w.print();
      w.close();
    }, 300);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={exportExcel}>Exporter Excel</Button>
      <Button variant="outline" onClick={exportPDF}>Exporter PDF</Button>
    </div>
  );
}


