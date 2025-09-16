"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { handlePrismaError } from "@/middlewares/message_error";
import { z } from "zod";
import { CreatePriceReferenceSchema, UpdatePriceReferenceSchema } from "@/models/mvc.pruned";

function toCDF(valueUSD: number, rate: number) {
  return valueUSD * rate;
}

export const createPriceReference = actionClient
  .schema(CreatePriceReferenceSchema)
  .action(async ({ parsedInput }) => {
    try {
      const rateValue = parsedInput.rate;
      if (!rateValue || rateValue <= 0) return { failure: "Taux de change requis" };

      const pmfUSD = (parsedInput as any).pmfCommercialUSD ?? (parsedInput.pmfCommercialCDF! / rateValue);
      const pmfCDF = toCDF(pmfUSD, rateValue);

      const logisticsTotal = parsedInput.logistics.warehouseFee;
      const margin = (parsedInput.commercial.marginPercent / 100) * pmfCDF;
      const commercialTotal = parsedInput.commercial.socComFee + margin;

      const para = parsedInput.parafiscality;
      const paraTotal =
        (para.stockSecurity1 ?? 0) +
        (para.stockSecurity2 ?? 0) +
        (para.molecularMarking ?? 0) +
        (para.foner ?? 0) +
        (para.reconstructionEffort ?? 0) +
        (para.intervention ?? 0);

      const fis = parsedInput.fiscality;
      const fiscalityTotal = (fis.total2 ?? 0);

      const priceRefCDF = pmfCDF + logisticsTotal + commercialTotal + paraTotal + fiscalityTotal;
      const priceRefUSD = priceRefCDF / rateValue;
      const priceRefUSDPerLitre = priceRefUSD / 1000;

      // Ensure we have a concrete exchangeRateId for FK
      const createdRate = await prisma.exchangeRate.create({ data: { rate: rateValue } });
      const exchangeRateIdVal = createdRate.id;

      const created = await prisma.priceReference.create({
        data: {
          nomStructure: parsedInput.nomStructure,
          structureSociete: parsedInput.structureSociete,
          cardinale: parsedInput.cardinale,
          userId: parsedInput.userId,
          pmfCommercialUSD: pmfUSD,
          pmfCommercialCDF: pmfCDF,
          exchangeRateId: exchangeRateIdVal!,
          priceRefCDF,
          priceRefUSD,
          priceRefUSDPerLitre,
          logisticsCosts: {
            create: {
              warehouseFee: parsedInput.logistics.warehouseFee,
              total: logisticsTotal,
            },
          },
          commercialCosts: {
            create: {
              socComFee: parsedInput.commercial.socComFee,
              margin,
              total: commercialTotal,
            },
          },
          parafiscality: {
            create: {
              stockSecurity1: para.stockSecurity1 ?? 0,
              stockSecurity2: para.stockSecurity2 ?? 0,
              molecularMarking: para.molecularMarking ?? 0,
              foner: para.foner ?? 0,
              reconstructionEffort: para.reconstructionEffort ?? 0,
              intervention: para.intervention ?? 0,
              total: paraTotal,
            },
          },
          fiscality: {
            create: {
              venteVAT: fis.venteVAT ?? null,
              customsDuty: fis.customsDuty ?? null,
              consumptionDuty: fis.consumptionDuty ?? null,
              importVAT: fis.importVAT ?? null,
              total1: fis.total1 ?? null,
              netVAT: fis.netVAT ?? null,
              total2: fis.total2 ?? null,
            },
          },
        },
      });

      return { success: created };
    } catch (error) {
      if (error instanceof z.ZodError) return { failure: "Validation failed: " + error };
      return { failure: handlePrismaError(error) };
    }
  });

export const listPriceReferences = actionClient
  .schema(z.void())
  .action(async () => {
    try {
      const items = await prisma.priceReference.findMany({
        include: {
          exchangeRate: true,
          logisticsCosts: true,
          commercialCosts: true,
          parafiscality: true,
          fiscality: true,
        },
        orderBy: { date: "desc" },
      });
      return { success: true, result: items };
    } catch (error) {
      return { success: false, failure: handlePrismaError(error) };
    }
  });

export async function findByIdAction(id: string) {
  try {
    if (!id) throw new Error("ID manquant");
    const item = await prisma.priceReference.findUnique({
      where: { id },
      include: {
        exchangeRate: true,
        logisticsCosts: true,
        commercialCosts: true,
        parafiscality: true,
        fiscality: true,
      },
    });
    if (!item) return { success: false, failure: "Structure introuvable" };
    return { success: true, result: item };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}

export const updatePriceReference = actionClient
  .schema(UpdatePriceReferenceSchema)
  .action(async ({ parsedInput }) => {
    try {
      const current = await prisma.priceReference.findUnique({
        where: { id: parsedInput.id },
        include: { commercialCosts: true, logisticsCosts: true, parafiscality: true, fiscality: true, exchangeRate: true },
      });
      if (!current) return { failure: "Structure introuvable" };

      // If a new rate is provided, create and use it; otherwise reuse existing
      let rateValue: number;
      if (parsedInput.rate != null) {
        rateValue = parsedInput.rate;
      } else {
        const existing = await prisma.exchangeRate.findUnique({ where: { id: current.exchangeRateId } });
        if (!existing) return { failure: "Taux introuvable" };
        rateValue = existing.rate;
      }

      const pmfUSD = parsedInput.pmfCommercialUSD ?? current.pmfCommercialUSD;
      const pmfCDF = pmfUSD * rateValue;

      const logisticsFee = parsedInput.logistics?.warehouseFee ?? current.logisticsCosts?.warehouseFee ?? 0;
      const logisticsTotal = logisticsFee;

      const soc = parsedInput.commercial?.socComFee ?? current.commercialCosts?.socComFee ?? 0;
      const marginPercent = parsedInput.commercial?.marginPercent ?? 10;
      const margin = (marginPercent / 100) * pmfCDF;
      const commercialTotal = soc + margin;

      const para = parsedInput.parafiscality ?? {} as any;
      const p1 = para.stockSecurity1 ?? current.parafiscality?.stockSecurity1 ?? 0;
      const p2 = para.stockSecurity2 ?? current.parafiscality?.stockSecurity2 ?? 0;
      const pm = para.molecularMarking ?? current.parafiscality?.molecularMarking ?? 0;
      const pf = para.foner ?? current.parafiscality?.foner ?? 0;
      const pr = para.reconstructionEffort ?? current.parafiscality?.reconstructionEffort ?? 0;
      const pi = para.intervention ?? current.parafiscality?.intervention ?? 0;
      const paraTotal = p1 + p2 + pm + pf + pr + pi;

      const fis2 = parsedInput.fiscality?.total2 ?? current.fiscality?.total2 ?? 0;
      const priceRefCDF = pmfCDF + logisticsTotal + commercialTotal + paraTotal + fis2;
      const priceRefUSD = priceRefCDF / rateValue;
      const priceRefUSDPerLitre = priceRefUSD / 1000;

      const updated = await prisma.priceReference.update({
        where: { id: parsedInput.id },
        data: {
          nomStructure: parsedInput.nomStructure ?? current.nomStructure,
          description: parsedInput.description ?? current.description,
          structureSociete: parsedInput.structureSociete ?? current.structureSociete,
          cardinale: parsedInput.cardinale ?? current.cardinale,
          userId: parsedInput.userId ?? current.userId,
          pmfCommercialUSD: pmfUSD,
          pmfCommercialCDF: pmfCDF,
          exchangeRateId: parsedInput.rate
            ? (await prisma.exchangeRate.create({ data: { rate: parsedInput.rate } })).id
            : current.exchangeRateId,
          priceRefCDF,
          priceRefUSD,
          priceRefUSDPerLitre,
          logisticsCosts: {
            upsert: {
              create: { warehouseFee: logisticsFee, total: logisticsTotal },
              update: { warehouseFee: logisticsFee, total: logisticsTotal },
            },
          },
          commercialCosts: {
            upsert: {
              create: { socComFee: soc, margin, total: commercialTotal },
              update: { socComFee: soc, margin, total: commercialTotal },
            },
          },
          parafiscality: {
            upsert: {
              create: { stockSecurity1: p1, stockSecurity2: p2, molecularMarking: pm, foner: pf, reconstructionEffort: pr, intervention: pi, total: paraTotal },
              update: { stockSecurity1: p1, stockSecurity2: p2, molecularMarking: pm, foner: pf, reconstructionEffort: pr, intervention: pi, total: paraTotal },
            },
          },
          fiscality: {
            upsert: {
              create: { total2: fis2 },
              update: { total2: fis2 },
            },
          },
        },
      });
      return { success: updated };
    } catch (error) {
      if (error instanceof z.ZodError) return { failure: "Validation failed: " + error };
      return { failure: handlePrismaError(error) };
    }
  });

export async function removeByIdAction(id: string) {
  try {
    await prisma.$transaction([
      prisma.logisticsCosts.deleteMany({ where: { priceReferenceId: id } }),
      prisma.commercialCosts.deleteMany({ where: { priceReferenceId: id } }),
      prisma.parafiscality.deleteMany({ where: { priceReferenceId: id } }),
      prisma.fiscality.deleteMany({ where: { priceReferenceId: id } }),
      prisma.priceReference.delete({ where: { id } }),
    ]);
    return { success: true };
  } catch (error) {
    return { success: false, failure: handlePrismaError(error) };
  }
}


