import { z } from "zod";

// ---- Users (align with Prisma Role enum) ----
export const CreateUserSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  // image removed from create form
  emailVerified: z.boolean().optional(),
  role: z.enum(["ADMIN", "COMMERCIAL"]).default("COMMERCIAL"),
});

export const UpdateUserSchema = z
  .object({
    id: z.string(),
    name: z.string().optional(),
    email: z.string().email().optional(),
    image: z.string().url().optional().nullable(),
    emailVerified: z.boolean().optional(),
    role: z.enum(["ADMIN", "COMMERCIAL"]).optional(),
  })
  .and(z.object({ id: z.string() }));

// ---- Pricing structures (PriceReference) ----
export const LogisticsCostsSchema = z.object({
  warehouseFee: z.number().nonnegative(),
});

export const CommercialCostsSchema = z.object({
  socComFee: z.number().nonnegative(),
  // La marge est saisie en CDF côté UI; convertie en % côté action
  marginPercent: z.number().nonnegative().default(0),
});

export const ParafiscalitySchema = z.object({
  stockSecurity1: z.number().nonnegative().default(0),
  stockSecurity2: z.number().nonnegative().default(0),
  molecularMarking: z.number().nonnegative().default(0),
  foner: z.number().nonnegative().default(0),
  reconstructionEffort: z.number().nonnegative().default(0),
  intervention: z.number().nonnegative().default(0),
});

export const FiscalitySchema = z.object({
  venteVAT: z.number().nonnegative().optional().nullable(),
  customsDuty: z.number().nonnegative().optional().nullable(),
  consumptionDuty: z.number().nonnegative().optional().nullable(),
  importVAT: z.number().nonnegative().optional().nullable(),
  total1: z.number().nonnegative().optional().nullable(),
  netVAT: z.number().optional().nullable(),
  total2: z.number().nonnegative().optional().nullable(),
});

const PriceReferenceCore = z.object({
  nomStructure: z.string().min(1),
  description: z.string().optional().nullable(),
  structureSociete: z.enum(["SOCIETE_MINE", "SOCIETE_AUTRE"]).default("SOCIETE_AUTRE"),
  cardinale: z.enum(["SUD", "NORD", "EST", "OUEST"]).default("SUD"),
  rate: z.number().positive().optional(),
  pmfCommercialUSD: z.number().nonnegative().optional(),
  pmfCommercialCDF: z.number().nonnegative().optional(),
  userId: z.string().min(1),
  logistics: LogisticsCostsSchema,
  commercial: CommercialCostsSchema,
  parafiscality: ParafiscalitySchema,
  fiscality: FiscalitySchema,
});

export const CreatePriceReferenceSchema = PriceReferenceCore.extend({
  pmfCommercialCDF: z.number().nonnegative(),
}).refine((d) => typeof d.rate === "number", {
  message: "Taux requis",
  path: ["rate"],
});

export const UpdatePriceReferenceSchema = PriceReferenceCore.partial().merge(
  z.object({ id: z.string() })
);

// ===== Cost Build Up (Builder) =====
export const BaseProductCostsSchema = z.object({
  plattsFOBUSD: z.number().nonnegative().default(0),
  truckTransportUSD: z.number().nonnegative().default(0),
  brutCFUSD: z.number().nonnegative().default(0),
  agencyCustomsUSD: z.number().nonnegative().default(0),
  acquisitionCostUSD: z.number().nonnegative().default(0),
}).partial();

export const SupplierDDUCostsSchema = z.object({
  storageHospitalityUSD: z.number().nonnegative().default(0),
  anrDechargementUSD: z.number().nonnegative().default(0),
  supplierMarginUSD: z.number().min(40, "La marge ne doit pas être inférieure à 40").default(40),
  sellingPriceDDUUSD: z.number().nonnegative().default(0),
}).partial();

export const CustomsCollectedSchema = z.object({
  customsDutyUSD: z.number().nonnegative().nullable().optional(),
  importVATUSD: z.number().nonnegative().nullable().optional(),
  subtotalUSD: z.number().nonnegative().nullable().optional(),
}).partial();

export const LeviesCollectedSchema = z.object({
  fonerUSD: z.number().nonnegative().nullable().optional(),
  molecularMarkingOrStockUSD: z.number().nonnegative().nullable().optional(),
  reconstructionStrategicUSD: z.number().nonnegative().nullable().optional(),
  economicInterventionUSD: z.number().nonnegative().nullable().optional(),
  totalDutiesAndVATUSD: z.number().nonnegative().nullable().optional(),
  totalLeviesUSD: z.number().nonnegative().nullable().optional(),
}).partial();

export const TransportAdditionalCostsSchema = z.object({
  freightToMineUSD: z.number().nonnegative().nullable().optional(),
  lossesLitresPerTruck: z.number().nonnegative().nullable().optional(),
  totalTransportFinalUSD: z.number().nonnegative().nullable().optional(),
}).partial();

export const BuildUpTotalsSchema = z.object({
  totalCustomsUSD: z.number().nonnegative().nullable().optional(),
  totalLeviesUSD: z.number().nonnegative().nullable().optional(),
  priceDDUUSD: z.number().nonnegative().nullable().optional(),
  priceDDPUSD: z.number().nonnegative().nullable().optional(),
}).partial();

export const CreateCostBuildUpSchema = z.object({
  title: z.string().min(1),
  unit: z.enum(["USD_M3", "USD_LITRE"]).default("USD_M3"),
  userId: z.string().min(1),
  priceReferenceId: z.string().optional().nullable(),
  nonMiningPriceStructureId: z.string().optional().nullable(),
  base: BaseProductCostsSchema.optional(),
  supplier: SupplierDDUCostsSchema.optional(),
  customs: CustomsCollectedSchema.optional(),
  levies: LeviesCollectedSchema.optional(),
  transport: TransportAdditionalCostsSchema.optional(),
  totals: BuildUpTotalsSchema.optional(),
});

export const UpdateCostBuildUpSchema = CreateCostBuildUpSchema.partial().and(
  z.object({ id: z.string() })
);

// ===== Structure de Prix Non-Minier =====
export const NonMiningDistributionCostsSchema = z.object({
  ogefrem: z.number().nonnegative().default(0),
  socirFees: z.number().nonnegative().default(0),
  sepSecurityCharges: z.number().nonnegative().default(0),
  additionalCapacitySPSA: z.number().nonnegative().default(0),
  lerexcomPetroleum: z.number().nonnegative().default(0),
  socComCharges: z.number().nonnegative().default(0),
  socComMargin: z.number().nonnegative().default(0),
});

export const NonMiningSecurityStockSchema = z.object({
  estStock: z.number().nonnegative().default(0),
  sudStock: z.number().nonnegative().default(0),
});

export const NonMiningParafiscalitySchema = z.object({
  foner: z.number().nonnegative().default(0),
  pmfFiscal: z.number().default(0), // Peut être négatif
});

export const NonMiningFiscalitySchema = z.object({
  venteVAT: z.number().nonnegative().default(0),
  customsDuty: z.number().nonnegative().default(0),
  consumptionDuty: z.number().default(0), // Peut être négatif
  importVAT: z.number().nonnegative().default(0),
  netVAT: z.number().nonnegative().default(0),
});

export const NonMiningFinalPricingSchema = z.object({
  referencePriceCDF: z.number().nonnegative().default(0),
  referencePriceUSD: z.number().nonnegative().default(0),
  appliedPriceCDF: z.number().nonnegative().default(0),
  appliedPriceUSD: z.number().nonnegative().default(0),
});

const NonMiningPriceStructureCore = z.object({
  nomStructure: z.string().min(1, "Le nom de la structure est requis"),
  description: z.string().optional().nullable(),
  cardinale: z.enum(["SUD", "NORD", "EST", "OUEST"]).default("SUD"),
  rate: z.number().positive().optional(),
  pmfCommercialUSD: z.number().nonnegative().optional(),
  pmfCommercialCDF: z.number().nonnegative().optional(),
  userId: z.string().min(1),
  distributionCosts: NonMiningDistributionCostsSchema,
  securityStock: NonMiningSecurityStockSchema,
  parafiscality: NonMiningParafiscalitySchema,
  fiscality: NonMiningFiscalitySchema,
  finalPricing: NonMiningFinalPricingSchema,
});

export const CreateNonMiningPriceStructureSchema = NonMiningPriceStructureCore.extend({
  pmfCommercialCDF: z.number().nonnegative(),
}).refine((d) => typeof d.rate === "number", {
  message: "Taux de change requis",
  path: ["rate"],
});

export const UpdateNonMiningPriceStructureSchema = NonMiningPriceStructureCore.partial().merge(
  z.object({ id: z.string() })
);


