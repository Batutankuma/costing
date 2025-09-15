"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { z } from "zod";
import {
  CreateCostBuildUpSchema,
  UpdateCostBuildUpSchema,
} from "@/models/mvc.pruned";

export const createBuilder = actionClient
  .schema(CreateCostBuildUpSchema)
  .action(async ({ parsedInput }) => {
    const data = parsedInput;
    const created = await prisma.costBuildUp.create({
      data: {
        title: data.title,
        description: (data as any).description ?? null,
        unit: data.unit as any,
        userId: data.userId,
        priceReferenceId: data.priceReferenceId ?? null,
        nonMiningPriceStructureId: data.nonMiningPriceStructureId ?? null,
        baseCosts: data.base
          ? { create: {
              plattsFOBUSD: data.base.plattsFOBUSD ?? 0,
              truckTransportUSD: data.base.truckTransportUSD ?? 0,
              brutCFUSD: data.base.brutCFUSD ?? 0,
              agencyCustomsUSD: data.base.agencyCustomsUSD ?? 0,
              acquisitionCostUSD: data.base.acquisitionCostUSD ?? 0,
            } }
          : undefined,
        supplierDDU: data.supplier
          ? { create: {
              storageHospitalityUSD: data.supplier.storageHospitalityUSD ?? 0,
              anrDechargementUSD: data.supplier.anrDechargementUSD ?? 0,
              supplierMarginUSD: data.supplier.supplierMarginUSD ?? 0,
              sellingPriceDDUUSD: data.supplier.sellingPriceDDUUSD ?? 0,
            } }
          : undefined,
        customs: data.customs
          ? { create: {
              customsDutyUSD: data.customs.customsDutyUSD ?? null,
              importVATUSD: data.customs.importVATUSD ?? null,
              subtotalUSD: data.customs.subtotalUSD ?? null,
            } }
          : undefined,
        levies: data.levies
          ? { create: {
              fonerUSD: data.levies.fonerUSD ?? null,
              molecularMarkingOrStockUSD: data.levies.molecularMarkingOrStockUSD ?? null,
              reconstructionStrategicUSD: data.levies.reconstructionStrategicUSD ?? null,
              economicInterventionUSD: data.levies.economicInterventionUSD ?? null,
              totalDutiesAndVATUSD: data.levies.totalDutiesAndVATUSD ?? null,
              totalLeviesUSD: data.levies.totalLeviesUSD ?? null,
            } }
          : undefined,
        transport: data.transport
          ? { create: {
              freightToMineUSD: data.transport.freightToMineUSD ?? null,
              lossesLitresPerTruck: data.transport.lossesLitresPerTruck ?? null,
              totalTransportFinalUSD: data.transport.totalTransportFinalUSD ?? null,
            } }
          : undefined,
        totals: data.totals
          ? { create: {
              totalCustomsUSD: data.totals.totalCustomsUSD ?? null,
              totalLeviesUSD: data.totals.totalLeviesUSD ?? null,
              priceDDUUSD: data.totals.priceDDUUSD ?? null,
              priceDDPUSD: data.totals.priceDDPUSD ?? null,
            } }
          : undefined,
      },
    });
    return { success: created };
  });

export const listBuilders = actionClient
  .schema(z.void())
  .action(async () => {
    const items = await prisma.costBuildUp.findMany({
      include: { baseCosts: true, supplierDDU: true, customs: true, levies: true, transport: true, totals: true, priceReference: true, nonMiningPriceStructure: true },
      orderBy: { date: "desc" },
    });
    return { success: true, result: items };
  });

export async function findBuilderById(id: string) {
  const item = await prisma.costBuildUp.findUnique({
    where: { id },
    include: { baseCosts: true, supplierDDU: true, customs: true, levies: true, transport: true, totals: true, priceReference: { include: { exchangeRate: true } }, nonMiningPriceStructure: { include: { exchangeRate: true } } },
  });
  if (!item) return { success: false, failure: "Introuvable" };
  return { success: true, result: item };
}

export const updateBuilder = actionClient
  .schema(UpdateCostBuildUpSchema)
  .action(async ({ parsedInput }) => {
    const id = (parsedInput as any).id as string;
    const c = parsedInput;
    const updated = await prisma.costBuildUp.update({
      where: { id },
      data: {
        title: c.title ?? undefined,
        description: (c as any).description ?? undefined,
        unit: c.unit as any,
        priceReferenceId: c.priceReferenceId ?? undefined,
        nonMiningPriceStructureId: c.nonMiningPriceStructureId ?? undefined,
        baseCosts: c.base ? {
          upsert: {
            create: {
              plattsFOBUSD: c.base.plattsFOBUSD ?? 0,
              truckTransportUSD: c.base.truckTransportUSD ?? 0,
              brutCFUSD: c.base.brutCFUSD ?? 0,
              agencyCustomsUSD: c.base.agencyCustomsUSD ?? 0,
              acquisitionCostUSD: c.base.acquisitionCostUSD ?? 0,
            },
            update: {
              plattsFOBUSD: c.base.plattsFOBUSD ?? 0,
              truckTransportUSD: c.base.truckTransportUSD ?? 0,
              brutCFUSD: c.base.brutCFUSD ?? 0,
              agencyCustomsUSD: c.base.agencyCustomsUSD ?? 0,
              acquisitionCostUSD: c.base.acquisitionCostUSD ?? 0,
            },
          },
        } : undefined,
        supplierDDU: c.supplier ? {
          upsert: {
            create: {
              storageHospitalityUSD: c.supplier.storageHospitalityUSD ?? 0,
              anrDechargementUSD: c.supplier.anrDechargementUSD ?? 0,
              supplierMarginUSD: c.supplier.supplierMarginUSD ?? 0,
              sellingPriceDDUUSD: c.supplier.sellingPriceDDUUSD ?? 0,
            },
            update: {
              storageHospitalityUSD: c.supplier.storageHospitalityUSD ?? 0,
              anrDechargementUSD: c.supplier.anrDechargementUSD ?? 0,
              supplierMarginUSD: c.supplier.supplierMarginUSD ?? 0,
              sellingPriceDDUUSD: c.supplier.sellingPriceDDUUSD ?? 0,
            },
          },
        } : undefined,
        customs: c.customs ? {
          upsert: {
            create: { customsDutyUSD: c.customs.customsDutyUSD ?? null, importVATUSD: c.customs.importVATUSD ?? null, subtotalUSD: c.customs.subtotalUSD ?? null },
            update: { customsDutyUSD: c.customs.customsDutyUSD ?? null, importVATUSD: c.customs.importVATUSD ?? null, subtotalUSD: c.customs.subtotalUSD ?? null },
          },
        } : undefined,
        levies: c.levies ? {
          upsert: {
            create: { fonerUSD: c.levies.fonerUSD ?? null, molecularMarkingOrStockUSD: c.levies.molecularMarkingOrStockUSD ?? null, reconstructionStrategicUSD: c.levies.reconstructionStrategicUSD ?? null, economicInterventionUSD: c.levies.economicInterventionUSD ?? null, totalDutiesAndVATUSD: c.levies.totalDutiesAndVATUSD ?? null, totalLeviesUSD: c.levies.totalLeviesUSD ?? null },
            update: { fonerUSD: c.levies.fonerUSD ?? null, molecularMarkingOrStockUSD: c.levies.molecularMarkingOrStockUSD ?? null, reconstructionStrategicUSD: c.levies.reconstructionStrategicUSD ?? null, economicInterventionUSD: c.levies.economicInterventionUSD ?? null, totalDutiesAndVATUSD: c.levies.totalDutiesAndVATUSD ?? null, totalLeviesUSD: c.levies.totalLeviesUSD ?? null },
          },
        } : undefined,
        transport: c.transport ? {
          upsert: {
            create: { freightToMineUSD: c.transport.freightToMineUSD ?? null, lossesLitresPerTruck: c.transport.lossesLitresPerTruck ?? null, totalTransportFinalUSD: c.transport.totalTransportFinalUSD ?? null },
            update: { freightToMineUSD: c.transport.freightToMineUSD ?? null, lossesLitresPerTruck: c.transport.lossesLitresPerTruck ?? null, totalTransportFinalUSD: c.transport.totalTransportFinalUSD ?? null },
          },
        } : undefined,
        totals: c.totals ? {
          upsert: {
            create: { totalCustomsUSD: c.totals.totalCustomsUSD ?? null, totalLeviesUSD: c.totals.totalLeviesUSD ?? null, priceDDUUSD: c.totals.priceDDUUSD ?? null, priceDDPUSD: c.totals.priceDDPUSD ?? null },
            update: { totalCustomsUSD: c.totals.totalCustomsUSD ?? null, totalLeviesUSD: c.totals.totalLeviesUSD ?? null, priceDDUUSD: c.totals.priceDDUUSD ?? null, priceDDPUSD: c.totals.priceDDPUSD ?? null },
          },
        } : undefined,
      },
    });
    return { success: updated };
  });

export async function removeBuilderById(id: string) {
  await prisma.$transaction([
    prisma.salesQuote.deleteMany({ where: { costBuildUpId: id } }),
    prisma.baseProductCosts.deleteMany({ where: { costBuildUpId: id } }),
    prisma.supplierDDUCosts.deleteMany({ where: { costBuildUpId: id } }),
    prisma.customsCollected.deleteMany({ where: { costBuildUpId: id } }),
    prisma.leviesCollected.deleteMany({ where: { costBuildUpId: id } }),
    prisma.transportAdditionalCosts.deleteMany({ where: { costBuildUpId: id } }),
    prisma.buildUpTotals.deleteMany({ where: { costBuildUpId: id } }),
    prisma.costBuildUp.delete({ where: { id } }),
  ]);
  return { success: true };
}


