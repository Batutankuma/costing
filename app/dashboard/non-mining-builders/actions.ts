"use server";

import prisma from "@/lib/prisma";
import { actionClient } from "@/lib/safe-action";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Schéma pour le Cost Build Up Non-Minier
const CreateNonMiningCostBuildUpSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  unit: z.enum(["USD_M3", "USD_LITRE"]),
  userId: z.string(),
  nonMiningPriceStructureId: z.string().optional(),
  
  // Coûts de base
  base: z.object({
    plattsFOBUSD: z.number().min(0).default(0),
    truckTransportUSD: z.number().min(0).default(0),
    brutCFUSD: z.number().min(0).default(0),
    agencyCustomsUSD: z.number().min(0).default(0),
    acquisitionCostUSD: z.number().min(0).default(0),
  }).optional(),
  
  // Coûts fournisseur DDU
  supplier: z.object({
    storageHospitalityUSD: z.number().min(0).default(0),
    anrDechargementUSD: z.number().min(0).default(0),
    supplierMarginUSD: z.number().min(0).default(0),
    sellingPriceDDUUSD: z.number().min(0).default(0),
  }).optional(),
  
  // Douanes
  customs: z.object({
    customsDutyUSD: z.number().min(0).default(0),
    importVATUSD: z.number().min(0).default(0),
    subtotalUSD: z.number().min(0).default(0),
  }).optional(),
  
  // Redevances
  levies: z.object({
    roadFundFonerUSD: z.number().min(0).default(0),
    stockSecuritySudUSD: z.number().min(0).default(0),
    reconstructionEffortUSD: z.number().min(0).default(0),
    economicInterventionUSD: z.number().min(0).default(0),
    totalLeviesUSD: z.number().min(0).default(0),
  }).optional(),
  
  // Transport additionnel
  additionalTransport: z.object({
    freightToMineUSD: z.number().min(0).default(0),
    lossesUSD: z.number().min(0).default(0),
    totalTransportUSD: z.number().min(0).default(0),
  }).optional(),
  
  // Prix finaux
  finalPricing: z.object({
    dduPriceUSD: z.number().min(0).default(0),
    ddpPriceUSD: z.number().min(0).default(0),
  }).optional(),
});

const UpdateNonMiningCostBuildUpSchema = CreateNonMiningCostBuildUpSchema.extend({
  id: z.string(),
});

export const createNonMiningBuilder = actionClient
  .schema(CreateNonMiningCostBuildUpSchema)
  .action(async ({ parsedInput }) => {
    try {
      const data = parsedInput;
      
      const created = await prisma.costBuildUp.create({
        data: {
          title: data.title,
          description: data.description ?? null,
          unit: data.unit as any,
          userId: data.userId,
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
                customsDutyUSD: data.customs.customsDutyUSD ?? 0,
                importVATUSD: data.customs.importVATUSD ?? 0,
                subtotalUSD: data.customs.subtotalUSD ?? 0,
              } }
            : undefined,
            
          levies: data.levies
            ? { create: {
                fonerUSD: data.levies.roadFundFonerUSD ?? 0,
                molecularMarkingOrStockUSD: data.levies.stockSecuritySudUSD ?? 0,
                reconstructionStrategicUSD: data.levies.reconstructionEffortUSD ?? 0,
                economicInterventionUSD: data.levies.economicInterventionUSD ?? 0,
                totalLeviesUSD: data.levies.totalLeviesUSD ?? 0,
              } }
            : undefined,
            
          transport: data.additionalTransport
            ? { create: {
                freightToMineUSD: data.additionalTransport.freightToMineUSD ?? 0,
                lossesLitresPerTruck: data.additionalTransport.lossesUSD ?? 0,
                totalTransportFinalUSD: data.additionalTransport.totalTransportUSD ?? 0,
              } }
            : undefined,
            
          totals: data.finalPricing
            ? { create: {
                priceDDUUSD: data.finalPricing.dduPriceUSD ?? 0,
                priceDDPUSD: data.finalPricing.ddpPriceUSD ?? 0,
              } }
            : undefined,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          nonMiningPriceStructure: {
            include: {
              exchangeRate: true,
            },
          },
          baseCosts: true,
          supplierDDU: true,
          customs: true,
          levies: true,
          transport: true,
          totals: true,
        },
      });

      revalidatePath("/dashboard/non-mining-builders");
      return { success: created };
    } catch (error) {
      console.error("Erreur lors de la création du cost build up:", error);
      return { failure: "Impossible de créer le cost build up" };
    }
  });

export const updateNonMiningBuilder = actionClient
  .schema(UpdateNonMiningCostBuildUpSchema)
  .action(async ({ parsedInput }) => {
    try {
      const { id, ...updateData } = parsedInput;
      
      const updated = await prisma.costBuildUp.update({
        where: { id },
        data: {
          title: updateData.title,
          description: updateData.description ?? null,
          unit: updateData.unit as any,
          nonMiningPriceStructureId: updateData.nonMiningPriceStructureId ?? null,
          baseCosts: updateData.base ? {
            upsert: {
              create: {
                plattsFOBUSD: updateData.base.plattsFOBUSD ?? 0,
                truckTransportUSD: updateData.base.truckTransportUSD ?? 0,
                brutCFUSD: updateData.base.brutCFUSD ?? 0,
                agencyCustomsUSD: updateData.base.agencyCustomsUSD ?? 0,
                acquisitionCostUSD: updateData.base.acquisitionCostUSD ?? 0,
              },
              update: {
                plattsFOBUSD: updateData.base.plattsFOBUSD ?? 0,
                truckTransportUSD: updateData.base.truckTransportUSD ?? 0,
                brutCFUSD: updateData.base.brutCFUSD ?? 0,
                agencyCustomsUSD: updateData.base.agencyCustomsUSD ?? 0,
                acquisitionCostUSD: updateData.base.acquisitionCostUSD ?? 0,
              },
            },
          } : undefined,
          supplierDDU: updateData.supplier ? {
            upsert: {
              create: {
                storageHospitalityUSD: updateData.supplier.storageHospitalityUSD ?? 0,
                anrDechargementUSD: updateData.supplier.anrDechargementUSD ?? 0,
                supplierMarginUSD: updateData.supplier.supplierMarginUSD ?? 0,
                sellingPriceDDUUSD: updateData.supplier.sellingPriceDDUUSD ?? 0,
              },
              update: {
                storageHospitalityUSD: updateData.supplier.storageHospitalityUSD ?? 0,
                anrDechargementUSD: updateData.supplier.anrDechargementUSD ?? 0,
                supplierMarginUSD: updateData.supplier.supplierMarginUSD ?? 0,
                sellingPriceDDUUSD: updateData.supplier.sellingPriceDDUUSD ?? 0,
              },
            },
          } : undefined,
          customs: updateData.customs ? {
            upsert: {
              create: {
                customsDutyUSD: updateData.customs.customsDutyUSD ?? 0,
                importVATUSD: updateData.customs.importVATUSD ?? 0,
                subtotalUSD: updateData.customs.subtotalUSD ?? 0,
              },
              update: {
                customsDutyUSD: updateData.customs.customsDutyUSD ?? 0,
                importVATUSD: updateData.customs.importVATUSD ?? 0,
                subtotalUSD: updateData.customs.subtotalUSD ?? 0,
              },
            },
          } : undefined,
          levies: updateData.levies ? {
            upsert: {
              create: {
                fonerUSD: updateData.levies.roadFundFonerUSD ?? 0,
                molecularMarkingOrStockUSD: updateData.levies.stockSecuritySudUSD ?? 0,
                reconstructionStrategicUSD: updateData.levies.reconstructionEffortUSD ?? 0,
                economicInterventionUSD: updateData.levies.economicInterventionUSD ?? 0,
                totalLeviesUSD: updateData.levies.totalLeviesUSD ?? 0,
              },
              update: {
                fonerUSD: updateData.levies.roadFundFonerUSD ?? 0,
                molecularMarkingOrStockUSD: updateData.levies.stockSecuritySudUSD ?? 0,
                reconstructionStrategicUSD: updateData.levies.reconstructionEffortUSD ?? 0,
                economicInterventionUSD: updateData.levies.economicInterventionUSD ?? 0,
                totalLeviesUSD: updateData.levies.totalLeviesUSD ?? 0,
              },
            },
          } : undefined,
          transport: updateData.additionalTransport ? {
            upsert: {
              create: {
                freightToMineUSD: updateData.additionalTransport.freightToMineUSD ?? 0,
                lossesLitresPerTruck: updateData.additionalTransport.lossesUSD ?? 0,
                totalTransportFinalUSD: updateData.additionalTransport.totalTransportUSD ?? 0,
              },
              update: {
                freightToMineUSD: updateData.additionalTransport.freightToMineUSD ?? 0,
                lossesLitresPerTruck: updateData.additionalTransport.lossesUSD ?? 0,
                totalTransportFinalUSD: updateData.additionalTransport.totalTransportUSD ?? 0,
              },
            },
          } : undefined,
          totals: updateData.finalPricing ? {
            upsert: {
              create: {
                priceDDUUSD: updateData.finalPricing.dduPriceUSD ?? 0,
                priceDDPUSD: updateData.finalPricing.ddpPriceUSD ?? 0,
              },
              update: {
                priceDDUUSD: updateData.finalPricing.dduPriceUSD ?? 0,
                priceDDPUSD: updateData.finalPricing.ddpPriceUSD ?? 0,
              },
            },
          } : undefined,
        },
        include: {
          user: { select: { name: true, email: true } },
          nonMiningPriceStructure: { include: { exchangeRate: true } },
          baseCosts: true,
          supplierDDU: true,
          customs: true,
          levies: true,
          transport: true,
          totals: true,
        },
      });

      revalidatePath("/dashboard/non-mining-builders");
      return { success: updated };
    } catch (error) {
      console.error("Erreur lors de la mise à jour du cost build up:", error);
      return { failure: "Impossible de mettre à jour le cost build up" };
    }
  });

export const deleteNonMiningBuilder = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }) => {
    try {
      await prisma.costBuildUp.delete({
        where: { id: parsedInput.id },
      });

      revalidatePath("/dashboard/non-mining-builders");
      return { success: true };
    } catch (error) {
      console.error("Erreur lors de la suppression du cost build up:", error);
      return { failure: "Impossible de supprimer le cost build up" };
    }
  });

export async function getNonMiningBuilders() {
  try {
    const builders = await prisma.costBuildUp.findMany({
      where: {
        nonMiningPriceStructureId: { not: null },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        nonMiningPriceStructure: {
          include: {
            exchangeRate: true,
          },
        },
        baseCosts: true,
        supplierDDU: true,
        customs: true,
        levies: true,
        transport: true,
        totals: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return builders;
  } catch (error) {
    console.error("Erreur lors de la récupération des cost build ups:", error);
    return [];
  }
}

export async function getNonMiningBuilderById(id: string) {
  try {
    const builder = await prisma.costBuildUp.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        nonMiningPriceStructure: {
          include: {
            exchangeRate: true,
          },
        },
        baseCosts: true,
        supplierDDU: true,
        customs: true,
        levies: true,
        transport: true,
        totals: true,
      },
    });

    if (!builder) {
      throw new Error("Cost build up non trouvé");
    }

    return builder;
  } catch (error) {
    console.error("Erreur lors de la récupération du cost build up:", error);
    throw new Error("Impossible de récupérer le cost build up");
  }
}

export async function getNonMiningPriceStructures() {
  try {
    const structures = await prisma.nonMiningPriceStructure.findMany({
      include: {
        exchangeRate: true,
        fiscality: true,
        parafiscality: true,
        securityStock: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return structures;
  } catch (error) {
    console.error("Erreur lors de la récupération des structures non-minier:", error);
    return [];
  }
}
