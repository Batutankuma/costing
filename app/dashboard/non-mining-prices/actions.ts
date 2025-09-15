"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { handlePrismaError } from "@/middlewares/message_error";
import { CreateNonMiningPriceStructureSchema, UpdateNonMiningPriceStructureSchema } from "@/models/mvc.pruned";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function getNonMiningPrices() {
  try {
    const prices = await prisma.nonMiningPriceStructure.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        exchangeRate: {
          select: {
            rate: true,
            deviseBase: true,
            deviseTarget: true,
          },
        },
        distributionCosts: true,
        securityStock: true,
        parafiscality: true,
        fiscality: true,
        finalPricing: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return prices;
  } catch (error) {
    console.error("Erreur lors de la récupération des prix non-minier:", error);
    return [];
  }
}

export async function getNonMiningPriceById(id: string) {
  try {
    const price = await prisma.nonMiningPriceStructure.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        exchangeRate: {
          select: {
            rate: true,
            deviseBase: true,
            deviseTarget: true,
          },
        },
        distributionCosts: true,
        securityStock: true,
        parafiscality: true,
        fiscality: true,
        finalPricing: true,
      },
    });

    if (!price) {
      throw new Error("Structure de prix non trouvée");
    }

    return price;
  } catch (error) {
    console.error("Erreur lors de la récupération de la structure de prix:", error);
    throw new Error("Impossible de récupérer la structure de prix");
  }
}

export async function createNonMiningPriceStructure(data: z.infer<typeof CreateNonMiningPriceStructureSchema>) {
  try {
    // Valider les données
    const validatedData = CreateNonMiningPriceStructureSchema.parse(data);

    // Forcer un taux si non fourni
    const providedRate = validatedData.rate ?? 2500;

    // Créer un nouveau taux de change avec celui du formulaire (ou par défaut)
    const newRate = await prisma.exchangeRate.create({
      data: {
        rate: providedRate,
        deviseBase: 'CDF',
        deviseTarget: 'USD',
        validOn: new Date(),
      }
    });

    // Calculs serveurs (vérité unique)
    const rate = providedRate;
    const pmfCDF = validatedData.pmfCommercialCDF;
    const pmfUSD = pmfCDF / rate;

    const totalDistribution =
      (validatedData.distributionCosts.ogefrem || 0) +
      (validatedData.distributionCosts.socirFees || 0) +
      (validatedData.distributionCosts.sepSecurityCharges || 0) +
      (validatedData.distributionCosts.additionalCapacitySPSA || 0) +
      (validatedData.distributionCosts.lerexcomPetroleum || 0) +
      (validatedData.distributionCosts.socComCharges || 0) +
      (validatedData.distributionCosts.socComMargin || 0);

    const totalSecurity =
      (validatedData.securityStock.estStock || 0) +
      (validatedData.securityStock.sudStock || 0);

    const totalFiscality1 =
      (validatedData.fiscality.customsDuty || 0) +
      (validatedData.fiscality.consumptionDuty || 0) +
      (validatedData.fiscality.importVAT || 0);

    const totalFiscality2 = totalFiscality1 + (validatedData.fiscality.netVAT || 0);

    const referencePriceCDF =
      (pmfCDF || 0) +
      totalDistribution +
      totalSecurity +
      (validatedData.parafiscality.foner || 0) +
      totalFiscality2;

    const referencePriceUSD = referencePriceCDF / rate;
    const appliedPriceCDF = referencePriceCDF / 1000;
    const appliedPriceUSD = appliedPriceCDF / rate;

    // Créer la structure principale
    const structure = await prisma.nonMiningPriceStructure.create({
      data: {
        nomStructure: validatedData.nomStructure,
        description: validatedData.description,
        cardinale: validatedData.cardinale,
        pmfCommercialUSD: pmfUSD,
        pmfCommercialCDF: pmfCDF,
        exchangeRateId: newRate.id,
        userId: validatedData.userId,
        priceRefCDF: referencePriceCDF,
        priceRefUSD: referencePriceUSD,
        priceRefUSDPerLitre: referencePriceUSD / 1000,
        // Créer les relations
        distributionCosts: {
          create: {
            ogefrem: validatedData.distributionCosts.ogefrem,
            socirFees: validatedData.distributionCosts.socirFees,
            sepSecurityCharges: validatedData.distributionCosts.sepSecurityCharges,
            additionalCapacitySPSA: validatedData.distributionCosts.additionalCapacitySPSA,
            lerexcomPetroleum: validatedData.distributionCosts.lerexcomPetroleum,
            socComCharges: validatedData.distributionCosts.socComCharges,
            socComMargin: validatedData.distributionCosts.socComMargin,
            totalDistribution: totalDistribution,
          },
        },
        securityStock: {
          create: {
            estStock: validatedData.securityStock.estStock,
            sudStock: validatedData.securityStock.sudStock,
            totalSecurity: totalSecurity,
          },
        },
        parafiscality: {
          create: {
            foner: validatedData.parafiscality.foner,
            pmfFiscal: validatedData.parafiscality.pmfFiscal,
          },
        },
        fiscality: {
          create: {
            venteVAT: validatedData.fiscality.venteVAT,
            customsDuty: validatedData.fiscality.customsDuty,
            consumptionDuty: validatedData.fiscality.consumptionDuty,
            importVAT: validatedData.fiscality.importVAT,
            netVAT: validatedData.fiscality.netVAT,
            totalFiscality1: totalFiscality1,
            totalFiscality2: totalFiscality2,
          },
        },
        finalPricing: {
          create: {
            referencePriceCDF: referencePriceCDF,
            referencePriceUSD: referencePriceUSD,
            appliedPriceCDF: appliedPriceCDF,
            appliedPriceUSD: appliedPriceUSD,
          },
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        exchangeRate: {
          select: {
            rate: true,
            deviseBase: true,
            deviseTarget: true,
          },
        },
        distributionCosts: true,
        securityStock: true,
        parafiscality: true,
        fiscality: true,
        finalPricing: true,
      },
    });

    revalidatePath("/dashboard/non-mining-prices");
    return structure;
  } catch (error) {
    console.error("Erreur lors de la création de la structure de prix:", error);
    throw new Error("Impossible de créer la structure de prix");
  }
}

export async function updateNonMiningPriceStructure(data: z.infer<typeof UpdateNonMiningPriceStructureSchema>) {
  try {
    const validatedData = UpdateNonMiningPriceStructureSchema.parse(data);
    const { id, ...updateData } = validatedData;

    // Récupérer la structure existante
    const existing = await prisma.nonMiningPriceStructure.findUnique({
      where: { id },
      include: {
        distributionCosts: true,
        securityStock: true,
        parafiscality: true,
        fiscality: true,
        finalPricing: true,
        exchangeRate: true,
      },
    });

    if (!existing) {
      throw new Error("Structure de prix non trouvée");
    }

    // Préparer les valeurs pour calculs
    const rate = existing.exchangeRate.rate;
    const pmfCDF = updateData.pmfCommercialCDF ?? existing.pmfCommercialCDF;
    const pmfUSD = pmfCDF / rate;

    // Distribution
    const d = updateData.distributionCosts as any;
    const dist = {
      ogefrem: d?.ogefrem ?? existing.distributionCosts?.ogefrem ?? 0,
      socirFees: d?.socirFees ?? existing.distributionCosts?.socirFees ?? 0,
      sepSecurityCharges: d?.sepSecurityCharges ?? existing.distributionCosts?.sepSecurityCharges ?? 0,
      additionalCapacitySPSA: d?.additionalCapacitySPSA ?? existing.distributionCosts?.additionalCapacitySPSA ?? 0,
      lerexcomPetroleum: d?.lerexcomPetroleum ?? existing.distributionCosts?.lerexcomPetroleum ?? 0,
      socComCharges: d?.socComCharges ?? existing.distributionCosts?.socComCharges ?? 0,
      socComMargin: d?.socComMargin ?? existing.distributionCosts?.socComMargin ?? 0,
    };
    const totalDistribution = Object.values(dist).reduce((a: number, b: any) => a + (Number(b) || 0), 0);

    // Stock sécurité (unique total)
    const s = updateData.securityStock as any;
    const estStock = s?.estStock ?? existing.securityStock?.estStock ?? 0;
    const sudStock = s?.sudStock ?? existing.securityStock?.sudStock ?? 0;
    const totalSecurity = (estStock || 0) + (sudStock || 0);

    // Parafiscalité
    const p = updateData.parafiscality as any;
    const foner = p?.foner ?? existing.parafiscality?.foner ?? 0;
    const pmfFiscal = p?.pmfFiscal ?? existing.parafiscality?.pmfFiscal ?? 0;

    // Fiscalité
    const f = updateData.fiscality as any;
    const customsDuty = f?.customsDuty ?? existing.fiscality?.customsDuty ?? 0;
    const consumptionDuty = f?.consumptionDuty ?? existing.fiscality?.consumptionDuty ?? 0;
    const importVAT = f?.importVAT ?? existing.fiscality?.importVAT ?? 0;
    const netVAT = f?.netVAT ?? existing.fiscality?.netVAT ?? 0;
    const totalFiscality1 = customsDuty + consumptionDuty + importVAT;
    const totalFiscality2 = totalFiscality1 + netVAT;

    // Références de prix
    const referencePriceCDF = (pmfCDF || 0) + totalDistribution + totalSecurity + (foner || 0) + totalFiscality2;
    const referencePriceUSD = referencePriceCDF / rate;

    // Mettre à jour la structure et relations
    const updated = await prisma.nonMiningPriceStructure.update({
      where: { id },
      data: {
        nomStructure: updateData.nomStructure,
        description: updateData.description,
        cardinale: updateData.cardinale,
        pmfCommercialUSD: pmfUSD,
        pmfCommercialCDF: pmfCDF,
        priceRefCDF: referencePriceCDF,
        priceRefUSD: referencePriceUSD,
        priceRefUSDPerLitre: referencePriceUSD / 1000,
        distributionCosts: {
          upsert: {
            create: { ...dist, totalDistribution },
            update: { ...dist, totalDistribution },
          },
        },
        securityStock: {
          upsert: {
            create: { estStock, sudStock, totalSecurity },
            update: { estStock, sudStock, totalSecurity },
          },
        },
        parafiscality: {
          upsert: {
            create: { foner, pmfFiscal },
            update: { foner, pmfFiscal },
          },
        },
        fiscality: {
          upsert: {
            create: { venteVAT: f?.venteVAT ?? existing.fiscality?.venteVAT ?? 0, customsDuty, consumptionDuty, importVAT, netVAT, totalFiscality1, totalFiscality2 },
            update: { venteVAT: f?.venteVAT ?? existing.fiscality?.venteVAT ?? 0, customsDuty, consumptionDuty, importVAT, netVAT, totalFiscality1, totalFiscality2 },
          },
        },
        finalPricing: {
          upsert: {
            create: { referencePriceCDF, referencePriceUSD, appliedPriceCDF: referencePriceCDF / 1000, appliedPriceUSD: (referencePriceCDF / 1000) / rate },
            update: { referencePriceCDF, referencePriceUSD, appliedPriceCDF: referencePriceCDF / 1000, appliedPriceUSD: (referencePriceCDF / 1000) / rate },
          },
        },
      },
    });

    revalidatePath("/dashboard/non-mining-prices");
    return updated;
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la structure de prix:", error);
    throw new Error("Impossible de mettre à jour la structure de prix");
  }
}

export async function deleteNonMiningPriceStructure(id: string) {
  try {
    // Supprimer d'abord les enregistrements liés
    await prisma.nonMiningDistributionCosts.deleteMany({
      where: { nonMiningPriceId: id },
    });
    
    await prisma.nonMiningSecurityStock.deleteMany({
      where: { nonMiningPriceId: id },
    });
    
    await prisma.nonMiningParafiscality.deleteMany({
      where: { nonMiningPriceId: id },
    });
    
    await prisma.nonMiningFiscality.deleteMany({
      where: { nonMiningPriceId: id },
    });
    
    await prisma.nonMiningFinalPricing.deleteMany({
      where: { nonMiningPriceId: id },
    });

    // Supprimer les cost build ups liés
    await prisma.costBuildUp.deleteMany({
      where: { nonMiningPriceStructureId: id },
    });

    // Enfin, supprimer la structure principale
    await prisma.nonMiningPriceStructure.delete({
      where: { id },
    });

    revalidatePath("/dashboard/non-mining-prices");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression de la structure de prix:", error);
    throw new Error("Impossible de supprimer la structure de prix");
  }
}

export async function getExchangeRates() {
  try {
    const rates = await prisma.exchangeRate.findMany({
      orderBy: { validOn: "desc" },
      take: 10,
    });

    return rates;
  } catch (error) {
    console.error("Erreur lors de la récupération des taux de change:", error);
    throw new Error("Impossible de récupérer les taux de change");
  }
}
