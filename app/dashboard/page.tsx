import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { Button } from "@/components/button";

import { Chart01 } from "@/components/chart-01";
import { Chart02 } from "@/components/chart-02";
import { Chart03 } from "@/components/chart-03";
import { Chart04 } from "@/components/chart-04";
import { Chart05 } from "@/components/chart-05";
import { Chart06 } from "@/components/chart-06";

type MonthlyPoint = { month: string; actual: number; projected: number };
type GrowthPoint = { month: string; revenues: number; churn: number };
type ClientFlowPoint = { month: string; individual: number; team: number; enterprise: number };
type ProfitLossBreakdown = {
  sales: number;
  purchases: number;
  grossProfit: number;
  losses: number;
  netResult: number;
};

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonthsWindow(monthCount: number) {
  const now = new Date();
  const months: Array<{ key: string; label: string }> = [];
  for (let i = monthCount - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = getMonthKey(date);
    const label = date.toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
    months.push({ key, label });
  }
  return months;
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = (await searchParams) ?? {};
  const selectedDepotId = typeof resolvedParams.depotId === "string" ? resolvedParams.depotId : "all";
  const selectedProduitId = typeof resolvedParams.produitId === "string" ? resolvedParams.produitId : "all";
  const monthsParam = typeof resolvedParams.months === "string" ? Number(resolvedParams.months) : 12;
  const monthCount = [3, 6, 12].includes(monthsParam) ? monthsParam : 12;
  const serviceMinParam = typeof resolvedParams.serviceMin === "string" ? Number(resolvedParams.serviceMin) : 80;
  const coverageMinParam = typeof resolvedParams.coverageMin === "string" ? Number(resolvedParams.coverageMin) : 80;
  const lossesMaxPctParam = typeof resolvedParams.lossesMaxPct === "string" ? Number(resolvedParams.lossesMaxPct) : 5;
  const serviceMin = Number.isFinite(serviceMinParam) ? Math.min(100, Math.max(0, serviceMinParam)) : 80;
  const coverageMin = Number.isFinite(coverageMinParam) ? Math.min(100, Math.max(0, coverageMinParam)) : 80;
  const lossesMaxPct = Number.isFinite(lossesMaxPctParam) ? Math.min(100, Math.max(0, lossesMaxPctParam)) : 5;

  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - (monthCount - 1), 1);
  const months = buildMonthsWindow(monthCount);
  const monthSet = new Set(months.map((m) => m.key));

  const [depots, produits, deliveries, clientOrders, hospitalityRows, commandes, receptions, stockMovements] = await Promise.all([
    prisma.depot.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.delivery.findMany({
      select: {
        deliveryDate: true,
        total: true,
        qOffloaded: true,
        quantity: true,
        prixUnitaire: true,
        transporter: { select: { id: true, nom: true } },
        client: { select: { id: true, name: true, company: true } },
        depot: { select: { id: true, name: true } },
        produit: { select: { id: true, name: true } },
      },
      where: {
        deliveryDate: { gte: startDate },
        ...(selectedDepotId !== "all" ? { depotId: selectedDepotId } : {}),
        ...(selectedProduitId !== "all" ? { produitId: selectedProduitId } : {}),
      },
    }),
    prisma.clientOrder.findMany({
      select: { date: true, quantity: true, unitPrice: true },
      where: {
        date: { gte: startDate },
        ...(selectedDepotId !== "all" ? { depotId: selectedDepotId } : {}),
        ...(selectedProduitId !== "all" ? { produitId: selectedProduitId } : {}),
      },
    }),
    prisma.hospitality.findMany({
      select: { entryDate: true, total: true },
      where: {
        entryDate: { gte: startDate },
        ...(selectedDepotId !== "all" ? { depotId: selectedDepotId } : {}),
        ...(selectedProduitId !== "all" ? { commande: { produitId: selectedProduitId } } : {}),
      },
    }),
    prisma.commande.findMany({
      select: {
        date: true,
        quantite: true,
        unitPrice: true,
        hospitalityRows: { select: { offlQty20: true } },
        fournisseur: { select: { id: true, nom: true } },
      },
      where: {
        date: { gte: startDate },
        ...(selectedDepotId !== "all" ? { depotId: selectedDepotId } : {}),
        ...(selectedProduitId !== "all" ? { produitId: selectedProduitId } : {}),
      },
    }),
    prisma.reception.findMany({
      select: {
        receptionDate: true,
        quantity: true,
        commande: {
          select: {
            unitPrice: true,
            fournisseur: { select: { id: true, nom: true } },
          },
        },
        depot: { select: { id: true, name: true } },
        produit: { select: { id: true, name: true } },
      },
      where: {
        receptionDate: { gte: startDate },
        ...(selectedDepotId !== "all" ? { depotId: selectedDepotId } : {}),
        ...(selectedProduitId !== "all" ? { produitId: selectedProduitId } : {}),
      },
    }),
    prisma.stock.findMany({
      select: {
        date: true,
        quantite: true,
        prixUnitaireAchat: true,
        prixUnitaireVente: true,
        valeurEntree: true,
        valeurSortie: true,
        type: true,
        depotId: true,
        produitId: true,
        fournisseur: { select: { id: true, nom: true } },
      },
      where: {
        date: { gte: startDate },
        ...(selectedDepotId !== "all" ? { depotId: selectedDepotId } : {}),
        ...(selectedProduitId !== "all" ? { produitId: selectedProduitId } : {}),
      },
    }),
  ]);

  const stockEntries = stockMovements.filter((m) => m.type === "ENTREE");
  const stockSorties = stockMovements.filter((m) => m.type === "SORTIE");

  const deliveryRevenueByMonth = new Map<string, number>();
  for (const row of deliveries) {
    if (!row.deliveryDate) continue;
    const key = getMonthKey(row.deliveryDate);
    if (!monthSet.has(key)) continue;
    const amount = Number(row.total ?? 0);
    deliveryRevenueByMonth.set(key, Number(deliveryRevenueByMonth.get(key) || 0) + amount);
  }

  const orderRevenueByMonth = new Map<string, number>();
  const ordersCountByMonth = new Map<string, number>();
  for (const row of clientOrders) {
    if (!row.date) continue;
    const key = getMonthKey(row.date);
    if (!monthSet.has(key)) continue;
    const amount = Number(row.quantity ?? 0) * Number(row.unitPrice ?? 0);
    orderRevenueByMonth.set(key, Number(orderRevenueByMonth.get(key) || 0) + amount);
    ordersCountByMonth.set(key, Number(ordersCountByMonth.get(key) || 0) + 1);
  }

  const deliveriesCountByMonth = new Map<string, number>();
  for (const row of deliveries) {
    if (!row.deliveryDate) continue;
    const key = getMonthKey(row.deliveryDate);
    if (!monthSet.has(key)) continue;
    deliveriesCountByMonth.set(key, Number(deliveriesCountByMonth.get(key) || 0) + 1);
  }

  const hospitalityLossByMonth = new Map<string, number>();
  for (const row of hospitalityRows) {
    if (!row.entryDate) continue;
    const key = getMonthKey(row.entryDate);
    if (!monthSet.has(key)) continue;
    const amount = Math.abs(Number(row.total ?? 0));
    hospitalityLossByMonth.set(key, Number(hospitalityLossByMonth.get(key) || 0) + amount);
  }

  const orderedPurchaseQtyByMonth = new Map<string, number>();
  for (const row of commandes) {
    if (!row.date) continue;
    const key = getMonthKey(row.date);
    if (!monthSet.has(key)) continue;
    const hospitalityQty = row.hospitalityRows?.reduce((sum, item) => sum + Number(item.offlQty20 || 0), 0) || 0;
    const staticOrderedQty = Number(row.quantite || 0) + hospitalityQty;
    orderedPurchaseQtyByMonth.set(key, Number(orderedPurchaseQtyByMonth.get(key) || 0) + staticOrderedQty);
  }

  const receivedPurchaseQtyByMonth = new Map<string, number>();
  for (const row of stockEntries) {
    if (!row.date) continue;
    const key = getMonthKey(row.date);
    if (!monthSet.has(key)) continue;
    receivedPurchaseQtyByMonth.set(key, Number(receivedPurchaseQtyByMonth.get(key) || 0) + Number(row.quantite || 0));
  }

  const clientOrderedQtyByMonth = new Map<string, number>();
  for (const row of clientOrders) {
    if (!row.date) continue;
    const key = getMonthKey(row.date);
    if (!monthSet.has(key)) continue;
    clientOrderedQtyByMonth.set(key, Number(clientOrderedQtyByMonth.get(key) || 0) + Number(row.quantity || 0));
  }

  const clientDeliveredQtyByMonth = new Map<string, number>();
  for (const row of deliveries) {
    if (!row.deliveryDate) continue;
    const key = getMonthKey(row.deliveryDate);
    if (!monthSet.has(key)) continue;
    const deliveredQty = Number(row.qOffloaded ?? row.quantity ?? 0);
    clientDeliveredQtyByMonth.set(key, Number(clientDeliveredQtyByMonth.get(key) || 0) + deliveredQty);
  }

  const revenueChartData: MonthlyPoint[] = months.map((month) => ({
    month: month.label,
    actual: Number(deliveryRevenueByMonth.get(month.key) || 0),
    projected: Number(orderRevenueByMonth.get(month.key) || 0),
  }));

  const activityChartData: MonthlyPoint[] = months.map((month) => ({
    month: month.label,
    actual: Number(ordersCountByMonth.get(month.key) || 0),
    projected: Number(deliveriesCountByMonth.get(month.key) || 0),
  }));

  const growthChartData: GrowthPoint[] = months.map((month) => ({
    month: month.label,
    revenues: Number(deliveryRevenueByMonth.get(month.key) || 0),
    churn: -Number(hospitalityLossByMonth.get(month.key) || 0),
  }));

  const purchaseChartData: MonthlyPoint[] = months.map((month) => ({
    month: month.label,
    actual: Number(orderedPurchaseQtyByMonth.get(month.key) || 0),
    projected: Number(receivedPurchaseQtyByMonth.get(month.key) || 0),
  }));

  const clientFlowChartData: ClientFlowPoint[] = months.map((month) => {
    const ordered = Number(clientOrderedQtyByMonth.get(month.key) || 0);
    const delivered = Number(clientDeliveredQtyByMonth.get(month.key) || 0);
    const remainingOrLoss = Math.max(0, ordered - delivered);
    return {
      month: month.label,
      individual: ordered,
      team: delivered,
      enterprise: remainingOrLoss,
    };
  });

  const totalSalesAmountFromStock = stockSorties.reduce((sum, row) => {
    const qty = Number(row.quantite || 0);
    const unitSellPrice = Number(row.prixUnitaireVente ?? 0);
    return sum + qty * unitSellPrice;
  }, 0);
  const totalPurchaseAmountFromStock = stockEntries.reduce((sum, row) => {
    const entryValue = Number(row.valeurEntree ?? 0);
    if (entryValue > 0) return sum + entryValue;
    const qty = Number(row.quantite || 0);
    const unitBuyPrice = Number(row.prixUnitaireAchat ?? 0);
    return sum + qty * unitBuyPrice;
  }, 0);
  const grossProfit = totalSalesAmountFromStock - totalPurchaseAmountFromStock;
  const totalLosses = hospitalityRows.reduce((sum, row) => sum + Math.abs(Number(row.total || 0)), 0);
  const netResult = grossProfit;
  const profitLossData: ProfitLossBreakdown = {
    sales: totalSalesAmountFromStock,
    purchases: totalPurchaseAmountFromStock,
    grossProfit,
    losses: totalLosses,
    netResult,
  };

  const totalOrderedPurchaseQty = commandes.reduce((sum, row) => {
    const hospitalityQty = row.hospitalityRows?.reduce((acc, item) => acc + Number(item.offlQty20 || 0), 0) || 0;
    return sum + Number(row.quantite || 0) + hospitalityQty;
  }, 0);
  const totalReceivedPurchaseQty = stockEntries.reduce((sum, row) => sum + Number(row.quantite || 0), 0);
  const totalOrderedClientQty = clientOrders.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
  const totalDeliveredClientQty = deliveries.reduce(
    (sum, row) => sum + Number(row.qOffloaded ?? row.quantity ?? 0),
    0
  );
  const purchaseRemainingQty = Math.max(0, totalOrderedPurchaseQty - totalReceivedPurchaseQty);
  const purchaseLossQty = Math.max(0, totalReceivedPurchaseQty - totalOrderedPurchaseQty);
  const serviceRate = totalOrderedClientQty > 0 ? (totalDeliveredClientQty / totalOrderedClientQty) * 100 : 0;
  const receptionCoverageRate = totalOrderedPurchaseQty > 0 ? (totalReceivedPurchaseQty / totalOrderedPurchaseQty) * 100 : 0;

  const depotPerf = new Map<string, { name: string; sales: number; purchases: number; delivered: number; received: number }>();
  for (const row of deliveries) {
    const key = row.depot?.id ?? "unknown";
    const existing = depotPerf.get(key) ?? {
      name: row.depot?.name ?? "Dépôt non renseigné",
      sales: 0,
      purchases: 0,
      delivered: 0,
      received: 0,
    };
    existing.delivered += Number(row.qOffloaded ?? row.quantity ?? 0);
    existing.sales += Number(row.qOffloaded ?? row.quantity ?? 0) * Number(row.prixUnitaire ?? 0);
    depotPerf.set(key, existing);
  }
  for (const row of stockEntries) {
    const key = row.depotId ?? "unknown";
    const existing = depotPerf.get(key) ?? {
      name: depots.find((d) => d.id === row.depotId)?.name ?? "Dépôt non renseigné",
      sales: 0,
      purchases: 0,
      delivered: 0,
      received: 0,
    };
    existing.received += Number(row.quantite || 0);
    existing.purchases += Number(row.quantite || 0) * Number(row.prixUnitaireAchat ?? 0);
    depotPerf.set(key, existing);
  }
  const depotRows = Array.from(depotPerf.values())
    .map((row) => ({
      ...row,
      grossProfit: row.sales - row.purchases,
      marginPct: row.sales > 0 ? ((row.sales - row.purchases) / row.sales) * 100 : 0,
    }))
    .sort((a, b) => b.grossProfit - a.grossProfit)
    .slice(0, 8);

  const productPerf = new Map<string, { name: string; sales: number; purchases: number; delivered: number; received: number }>();
  for (const row of deliveries) {
    const key = row.produit?.id ?? "unknown";
    const existing = productPerf.get(key) ?? {
      name: row.produit?.name ?? "Produit non renseigné",
      sales: 0,
      purchases: 0,
      delivered: 0,
      received: 0,
    };
    existing.delivered += Number(row.qOffloaded ?? row.quantity ?? 0);
    existing.sales += Number(row.qOffloaded ?? row.quantity ?? 0) * Number(row.prixUnitaire ?? 0);
    productPerf.set(key, existing);
  }
  for (const row of stockEntries) {
    const key = row.produitId ?? "unknown";
    const existing = productPerf.get(key) ?? {
      name: produits.find((p) => p.id === row.produitId)?.name ?? "Produit non renseigné",
      sales: 0,
      purchases: 0,
      delivered: 0,
      received: 0,
    };
    existing.received += Number(row.quantite || 0);
    existing.purchases += Number(row.quantite || 0) * Number(row.prixUnitaireAchat ?? 0);
    productPerf.set(key, existing);
  }
  const productRows = Array.from(productPerf.values())
    .map((row) => ({
      ...row,
      grossProfit: row.sales - row.purchases,
      marginPct: row.sales > 0 ? ((row.sales - row.purchases) / row.sales) * 100 : 0,
    }))
    .sort((a, b) => b.grossProfit - a.grossProfit)
    .slice(0, 8);

  const transporterPerf = new Map<string, { name: string; delivered: number; sales: number; trips: number }>();
  for (const row of deliveries) {
    const key = row.transporter?.id ?? "unknown";
    const existing = transporterPerf.get(key) ?? {
      name: row.transporter?.nom ?? "Transporteur non renseigné",
      delivered: 0,
      sales: 0,
      trips: 0,
    };
    const deliveredQty = Number(row.qOffloaded ?? row.quantity ?? 0);
    existing.delivered += deliveredQty;
    existing.sales += deliveredQty * Number(row.prixUnitaire ?? 0);
    existing.trips += 1;
    transporterPerf.set(key, existing);
  }
  const topTransporters = Array.from(transporterPerf.values())
    .sort((a, b) => b.delivered - a.delivered)
    .slice(0, 3);

  const clientPerf = new Map<string, { name: string; delivered: number; sales: number; orders: number }>();
  for (const row of deliveries) {
    const key = row.client?.id ?? "unknown";
    const clientName = row.client?.company || row.client?.name || "Client non renseigné";
    const existing = clientPerf.get(key) ?? { name: clientName, delivered: 0, sales: 0, orders: 0 };
    const deliveredQty = Number(row.qOffloaded ?? row.quantity ?? 0);
    existing.delivered += deliveredQty;
    existing.sales += deliveredQty * Number(row.prixUnitaire ?? 0);
    existing.orders += 1;
    clientPerf.set(key, existing);
  }
  const topClients = Array.from(clientPerf.values())
    .sort((a, b) => b.delivered - a.delivered)
    .slice(0, 8);

  const supplierPerf = new Map<string, { name: string; ordered: number; received: number; cost: number; receptionOps: number }>();
  for (const row of commandes) {
    const key = row.fournisseur?.id ?? "unknown";
    const existing = supplierPerf.get(key) ?? {
      name: row.fournisseur?.nom ?? "Fournisseur non renseigné",
      ordered: 0,
      received: 0,
      cost: 0,
      receptionOps: 0,
    };
    const hospitalityQty = row.hospitalityRows?.reduce((acc, item) => acc + Number(item.offlQty20 || 0), 0) || 0;
    existing.ordered += Number(row.quantite || 0) + hospitalityQty;
    supplierPerf.set(key, existing);
  }
  for (const row of stockEntries) {
    const key = row.fournisseur?.id ?? "unknown";
    const existing = supplierPerf.get(key) ?? {
      name: row.fournisseur?.nom ?? "Fournisseur non renseigné",
      ordered: 0,
      received: 0,
      cost: 0,
      receptionOps: 0,
    };
    const qty = Number(row.quantite || 0);
    existing.received += qty;
    existing.cost += qty * Number(row.prixUnitaireAchat ?? 0);
    existing.receptionOps += 1;
    supplierPerf.set(key, existing);
  }
  const supplierRows = Array.from(supplierPerf.values())
    .map((row) => ({
      ...row,
      coveragePct: row.ordered > 0 ? (row.received / row.ordered) * 100 : 0,
    }))
    .sort((a, b) => b.received - a.received)
    .slice(0, 8);

  const alerts: string[] = [];
  if (serviceRate < serviceMin) alerts.push(`Taux de service client inférieur à ${serviceMin}% (livraisons vs commandes clients).`);
  if (receptionCoverageRate < coverageMin) alerts.push(`Couverture des réceptions inférieure à ${coverageMin}% (approvisionnement sous tension).`);
  if (profitLossData.netResult < 0) alerts.push("Résultat net négatif sur la période sélectionnée.");
  if (profitLossData.losses > profitLossData.sales * (lossesMaxPct / 100)) {
    alerts.push(`Pertes d'exploitation élevées (>${lossesMaxPct}% du chiffre d'affaires ventes).`);
  }
  if (alerts.length === 0) alerts.push("Indicateurs dans la zone de contrôle sur la période sélectionnée.");

  const depotRiskRows = depotRows
    .map((row) => {
      const servicePct = row.received > 0 ? (row.delivered / row.received) * 100 : 0;
      let riskScore = 0;
      if (row.grossProfit < 0) riskScore += 3;
      if (servicePct < serviceMin) riskScore += 2;
      if (row.marginPct < 0) riskScore += 2;
      return { ...row, servicePct, riskScore };
    })
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 8);

  const productRiskRows = productRows
    .map((row) => {
      const flowPct = row.received > 0 ? (row.delivered / row.received) * 100 : 0;
      let riskScore = 0;
      if (row.grossProfit < 0) riskScore += 3;
      if (flowPct < serviceMin) riskScore += 2;
      if (row.marginPct < 0) riskScore += 2;
      return { ...row, flowPct, riskScore };
    })
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 8);

  const exportRows: string[] = [];
  exportRows.push("Section,Element,Valeur 1,Valeur 2,Valeur 3");
  exportRows.push(`KPI,Qté commandée achat,${Math.round(totalOrderedPurchaseQty)},L,`);
  exportRows.push(`KPI,Qté reçue achat,${Math.round(totalReceivedPurchaseQty)},L,`);
  exportRows.push(`KPI,Qté restante/perte achat,${Math.round(purchaseRemainingQty + purchaseLossQty)},L,`);
  exportRows.push(`KPI,Bénéfice net,${Math.round(profitLossData.netResult)},USD,`);
  for (const row of depotRows) {
    exportRows.push(
      `MARGE_DEPOT,${row.name},${Math.round(row.grossProfit)},${row.marginPct.toFixed(2)}%,${Math.round(row.delivered)}L`
    );
  }
  for (const row of productRows) {
    exportRows.push(
      `MARGE_PRODUIT,${row.name},${Math.round(row.grossProfit)},${row.marginPct.toFixed(2)}%,${Math.round(row.delivered)}L`
    );
  }
  for (const row of depotRiskRows) {
    exportRows.push(
      `RISQUE_DEPOT,${row.name},Score ${row.riskScore},Service ${row.servicePct.toFixed(1)}%,Marge ${row.marginPct.toFixed(1)}%`
    );
  }
  for (const row of productRiskRows) {
    exportRows.push(
      `RISQUE_PRODUIT,${row.name},Score ${row.riskScore},Flux ${row.flowPct.toFixed(1)}%,Marge ${row.marginPct.toFixed(1)}%`
    );
  }
  const csvDataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(exportRows.join("\n"))}`;

  return (
    <div className="px-4 md:px-6 lg:px-8 @container">
      <div className="w-full max-w-6xl mx-auto">
        <div className="space-y-4 mb-4">
          <Card>
            <CardHeader>
              <CardTitle>Filtres de pilotage</CardTitle>
              <CardDescription>
                Pilotage multi-dépôts pour le contrôle de gestion et l'analyse opérationnelle.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-3 items-end">
                <div className="space-y-1">
                  <label htmlFor="depotId" className="text-xs text-muted-foreground">Dépôt</label>
                  <select id="depotId" name="depotId" defaultValue={selectedDepotId} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="all">Tous les dépôts</option>
                    {depots.map((depot) => (
                      <option key={depot.id} value={depot.id}>
                        {depot.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="produitId" className="text-xs text-muted-foreground">Produit</label>
                  <select id="produitId" name="produitId" defaultValue={selectedProduitId} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="all">Tous les produits</option>
                    {produits.map((produit) => (
                      <option key={produit.id} value={produit.id}>
                        {produit.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="months" className="text-xs text-muted-foreground">Période</label>
                  <select id="months" name="months" defaultValue={String(monthCount)} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
                    <option value="3">3 mois</option>
                    <option value="6">6 mois</option>
                    <option value="12">12 mois</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="serviceMin" className="text-xs text-muted-foreground">Seuil service %</label>
                  <input id="serviceMin" name="serviceMin" type="number" min={0} max={100} defaultValue={serviceMin} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="coverageMin" className="text-xs text-muted-foreground">Seuil couverture %</label>
                  <input id="coverageMin" name="coverageMin" type="number" min={0} max={100} defaultValue={coverageMin} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="lossesMaxPct" className="text-xs text-muted-foreground">Seuil pertes % CA</label>
                  <input id="lossesMaxPct" name="lossesMaxPct" type="number" min={0} max={100} defaultValue={lossesMaxPct} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
                </div>
                <Button type="submit">Actualiser</Button>
              </form>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="py-4 gap-2">
              <CardHeader><CardTitle>Qté commandée achat</CardTitle></CardHeader>
              <CardContent className="text-xl font-semibold">{Math.round(totalOrderedPurchaseQty).toLocaleString("fr-FR")} L</CardContent>
            </Card>
            <Card className="py-4 gap-2">
              <CardHeader><CardTitle>Qté reçue achat</CardTitle></CardHeader>
              <CardContent className="text-xl font-semibold">{Math.round(totalReceivedPurchaseQty).toLocaleString("fr-FR")} L</CardContent>
            </Card>
            <Card className="py-4 gap-2">
              <CardHeader><CardTitle>Qté restante/perte achat</CardTitle></CardHeader>
              <CardContent className="text-xl font-semibold">
                {Math.round(purchaseRemainingQty + purchaseLossQty).toLocaleString("fr-FR")} L
              </CardContent>
            </Card>
            <Card className="py-4 gap-2">
              <CardHeader><CardTitle>Bénéfice net</CardTitle></CardHeader>
              <CardContent className="text-xl font-semibold">${Math.round(profitLossData.netResult).toLocaleString("fr-FR")}</CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Alertes contrôle de gestion</CardTitle>
              <CardDescription>Signaux prioritaires pour les contrôleurs et data analysts.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {alerts.map((item) => (
                  <li key={item} className="rounded-md border px-3 py-2">{item}</li>
                ))}
              </ul>
              <div className="mt-3 flex justify-end">
                <a href={csvDataUri} download="dashboard-controle-gestion.csv">
                  <Button variant="outline">Exporter synthèse (CSV)</Button>
                </a>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card>
              <CardHeader>
                <CardTitle>Analyse marge par dépôt</CardTitle>
                <CardDescription>Top dépôts par bénéfice brut sur la période.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {depotRows.length === 0 ? <div className="rounded-md border px-3 py-2">Aucune donnée.</div> : null}
                  {depotRows.map((row) => (
                    <div key={row.name} className="rounded-md border px-3 py-2 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Livré: {Math.round(row.delivered).toLocaleString("fr-FR")} L | Reçu: {Math.round(row.received).toLocaleString("fr-FR")} L
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${Math.round(row.grossProfit).toLocaleString("fr-FR")}</div>
                        <div className="text-xs text-muted-foreground">{row.marginPct.toFixed(1)}% de marge</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analyse marge par produit</CardTitle>
                <CardDescription>Top produits par bénéfice brut sur la période.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {productRows.length === 0 ? <div className="rounded-md border px-3 py-2">Aucune donnée.</div> : null}
                  {productRows.map((row) => (
                    <div key={row.name} className="rounded-md border px-3 py-2 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Vendu: {Math.round(row.delivered).toLocaleString("fr-FR")} L | Reçu: {Math.round(row.received).toLocaleString("fr-FR")} L
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${Math.round(row.grossProfit).toLocaleString("fr-FR")}</div>
                        <div className="text-xs text-muted-foreground">{row.marginPct.toFixed(1)}% de marge</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card>
              <CardHeader>
                <CardTitle>Dépôts à risque</CardTitle>
                <CardDescription>Priorisation selon marge négative et niveau de service.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {depotRiskRows.length === 0 ? <div className="rounded-md border px-3 py-2">Aucune donnée.</div> : null}
                  {depotRiskRows.map((row) => (
                    <div key={`risk-depot-${row.name}`} className="rounded-md border px-3 py-2 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Service {row.servicePct.toFixed(1)}% | Marge {row.marginPct.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">Score {row.riskScore}</div>
                        <div className="text-xs text-muted-foreground">${Math.round(row.grossProfit).toLocaleString("fr-FR")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Produits à risque</CardTitle>
                <CardDescription>Priorisation selon marge et conversion réception-vers-vente.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {productRiskRows.length === 0 ? <div className="rounded-md border px-3 py-2">Aucune donnée.</div> : null}
                  {productRiskRows.map((row) => (
                    <div key={`risk-product-${row.name}`} className="rounded-md border px-3 py-2 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Flux {row.flowPct.toFixed(1)}% | Marge {row.marginPct.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">Score {row.riskScore}</div>
                        <div className="text-xs text-muted-foreground">${Math.round(row.grossProfit).toLocaleString("fr-FR")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <Card>
              <CardHeader>
                <CardTitle>Top 3 transporteurs</CardTitle>
                <CardDescription>Classement sur volume livré.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {topTransporters.length === 0 ? <div className="rounded-md border px-3 py-2">Aucune donnée.</div> : null}
                  {topTransporters.map((row, idx) => (
                    <div key={`transporter-${row.name}`} className="rounded-md border px-3 py-2 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">#{idx + 1} {row.name}</div>
                        <div className="text-xs text-muted-foreground">{row.trips} livraisons</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{Math.round(row.delivered).toLocaleString("fr-FR")} L</div>
                        <div className="text-xs text-muted-foreground">${Math.round(row.sales).toLocaleString("fr-FR")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Clients les plus vendus</CardTitle>
                <CardDescription>Top clients selon quantité livrée.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {topClients.length === 0 ? <div className="rounded-md border px-3 py-2">Aucune donnée.</div> : null}
                  {topClients.map((row) => (
                    <div key={`client-${row.name}`} className="rounded-md border px-3 py-2 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs text-muted-foreground">{row.orders} lignes livraison</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{Math.round(row.delivered).toLocaleString("fr-FR")} L</div>
                        <div className="text-xs text-muted-foreground">${Math.round(row.sales).toLocaleString("fr-FR")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistiques fournisseurs</CardTitle>
                <CardDescription>Commande, réception et couverture.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {supplierRows.length === 0 ? <div className="rounded-md border px-3 py-2">Aucune donnée.</div> : null}
                  {supplierRows.map((row) => (
                    <div key={`supplier-${row.name}`} className="rounded-md border px-3 py-2 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Cmd: {Math.round(row.ordered).toLocaleString("fr-FR")} L | Reçu: {Math.round(row.received).toLocaleString("fr-FR")} L
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{row.coveragePct.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">${Math.round(row.cost).toLocaleString("fr-FR")}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="overflow-hidden">
          <div className="grid auto-rows-min @2xl:grid-cols-2 *:-ms-px *:-mt-px -m-px">
            <Chart01 data={revenueChartData} />
            <Chart02 data={activityChartData} />
            <Chart03 data={growthChartData} />
            <Chart04 data={purchaseChartData} />
            <Chart05 data={clientFlowChartData} />
            <Chart06 data={profitLossData} />
          </div>
        </div>
      </div>
    </div>
  );
}
