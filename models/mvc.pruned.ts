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
  escortFeesUSD: z.number().nonnegative().default(0),
  bankInterestUSD: z.number().nonnegative().default(0),
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
  unit: z.enum(["USD_M3", "USD_LITRE"]),
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

// ===== Costing Kinshasa =====
export const KinshasaCostRowSchema = z.object({
  label: z.string().min(1),
  client: z.number().default(0),
  threshold: z.number().default(0),
  proposal: z.number().default(0),
  mag: z.number().default(0),
  afterMag: z.number().default(0),
});

const KinshasaCostingCoreSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional().nullable(),
  productId: z.string().min(1, "Le produit est requis"),
  currency: z.enum(["USD", "CDF"]).default("CDF"),
  volumeM3: z.number().nonnegative().default(0),
  unitPriceUsd: z.number().nonnegative().default(0),
  clientExchangeRate: z.number().nonnegative().default(0),
  benchmarkExchangeRate: z.number().nonnegative().default(0),
  engenPriceCDF: z.number().nonnegative().default(0),
  engenPriceUSD: z.number().nonnegative().default(0),
  cdfBreakdown: z.array(KinshasaCostRowSchema),
  usdBreakdown: z.array(KinshasaCostRowSchema),
  notes: z.string().optional().nullable(),
});

export const CreateKinshasaCostingSchema = KinshasaCostingCoreSchema;

export const UpdateKinshasaCostingSchema = KinshasaCostingCoreSchema.partial().and(
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

// ===== CRM: Fournisseurs =====
export const CreateFournisseurSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  adresse: z.string().optional().nullable(),
});

export const FournisseurSchema = z.object({
  id: z.string(),
  nom: z.string().min(1, "Le nom est requis"),
  adresse: z.string().optional().nullable(),
});

// ===== Factures Manuelles =====
export const FactureLineSchema = z.object({
  description: z.string().min(1, "Description requise"),
  unit: z.string().min(1, "Unité requise"),
  quantity: z.number().min(0, "Quantité invalide"),
  unitPrice: z.number().min(0, "Prix unitaire invalide"),
});

export const CreateManualFactureSchema = z.object({
  invoiceNumber: z.string().min(1, "Numéro de facture requis"),
  invoiceDate: z.date(),
  vendorName: z.string().min(1, "Nom du vendeur requis"),
  vendorAddress: z.string().optional().nullable(),
  vendorTaxNumber: z.string().optional().nullable(),
  clientName: z.string().min(1, "Nom du client requis"),
  clientAddress: z.string().optional().nullable(),
  clientTaxNumber: z.string().optional().nullable(),
  purchaseOrder: z.string().optional().nullable(),
  dueInDays: z.number().min(0).default(7),
  currency: z.string().default("USD"),
  notes: z.string().optional().nullable(),
  lines: z.array(FactureLineSchema).min(1, "Ajoutez au moins un article"),
  taxRate: z.number().min(0).max(100).default(0),
  otherFees: z.number().min(0).default(0),
});

export const ManualFactureSchema = CreateManualFactureSchema.extend({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  subtotal: z.number(),
  taxAmount: z.number(),
  total: z.number(),
});

export type ManualFacture = z.infer<typeof ManualFactureSchema>;

// ===== Stocks =====
export const CreateStockSchema = z.object({
  date: z.date(),
  reference: z.string().min(1, "La référence est requise"),
  depotId: z.string().optional().nullable(),
  type: z.enum(["ENTREE", "SORTIE"]),
  fournisseurId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  produitId: z.string().min(1, "Le produit est requis"),
  quantite: z.number().min(0, "La quantité doit être positive"),
  prixUnitaireVente: z.number().optional().nullable(),
  prixUnitaireAchat: z.number().optional().nullable(),
  unite: z.nativeEnum({
    KG: "KG",
    G: "G",
    L: "L",
    ML: "ML",
    TONNE: "TONNE",
    PIECE: "PIECE",
    BOITE: "BOITE",
    CAISSON: "CAISSON",
    POUCE: "POUCE",
    METRE: "METRE",
    METRE_CARRE: "METRE_CARRE",
    METRE_CUBE: "METRE_CUBE",
    METRE_LINEAIRE: "METRE_LINEAIRE",
  }),
  devise: z.nativeEnum({
    XOF: "XOF",
    USD: "USD",
    EUR: "EUR",
    CDF: "CDF",
  }),
  seuilMinimum: z.number().min(0, "Le seuil minimum doit être positif"),
});

export const StockSchema = CreateStockSchema.extend({
  id: z.string(),
});

// Export enums pour usage dans les composants
export const TypeStockEnum = z.enum(["ENTREE", "SORTIE"]);
export const UniteEnum = z.nativeEnum({
  KG: "KG",
  G: "G",
  L: "L",
  ML: "ML",
  TONNE: "TONNE",
  PIECE: "PIECE",
  BOITE: "BOITE",
  CAISSON: "CAISSON",
  POUCE: "POUCE",
  METRE: "METRE",
  METRE_CARRE: "METRE_CARRE",
  METRE_CUBE: "METRE_CUBE",
  METRE_LINEAIRE: "METRE_LINEAIRE",
});
export const DeviseEnum = z.nativeEnum({
  XOF: "XOF",
  USD: "USD",
  EUR: "EUR",
  CDF: "CDF",
});

// ===== Tanks =====
export const CreateTankSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  capacity: z.number().min(0, "La capacité doit être positive"),
  currentLevel: z.number().min(0, "Le niveau actuel doit être positif").optional(),
  unit: z.string(),
  depotId: z.string().optional().nullable(),
  produitId: z.string().optional().nullable(),
});

export const TankSchema = CreateTankSchema.extend({
  id: z.string(),
});

// ===== Commande =====
export const CreateCommandeSchema = z.object({
  reference: z.string().min(1, "La référence est requise"),
  date: z.date(),
  status: z.enum(["DRAFT", "CONFIRMED", "COMPLETED", "CANCELLED", "PARTIALLY_RECEIVED"]).default("DRAFT"),
  depotId: z.string().optional().nullable(),
  produitId: z.string().min(1, "Le produit est requis"),
  fournisseurId: z.string().optional().nullable(),
  quantite: z.number().min(0, "La quantité doit être positive"),
  unitPrice: z.number().optional().nullable(),
  devise: z.enum(["XOF", "USD", "EUR", "CDF"]).default("USD").optional().nullable(),
});

export const CommandeSchema = CreateCommandeSchema.extend({
  id: z.string(),
});

// ===== Reception =====
export const CreateReceptionSchema = z.object({
  reference: z.string().optional().nullable(),
  receptionDate: z.date(),
  quantity: z.number().min(0, "La quantité doit être positive"),
  unit: z.string().min(1, "L'unité est requise"),
  receptionStatus: z.enum(["RECEIVED", "IN_TRANSIT", "CANCELLED"]).default("RECEIVED"),
  commandeId: z.string().optional().nullable(),
  depotId: z.string().optional().nullable(),
  produitId: z.string().optional().nullable(),
  tankId: z.string().optional().nullable(),
});

export const ReceptionSchema = CreateReceptionSchema.extend({
  id: z.string(),
});

// ===== Delivery =====
export const CreateDeliverySchema = z.object({
  reference: z.string().optional().nullable(),
  deliveryDate: z.date(),
  quantity: z.number().min(0, "La quantité doit être positive"),
  unit: z.string().min(1, "L'unité est requise"),
  openingEter: z.number().optional().nullable(),
  closingEter: z.number().optional().nullable(),
  prixUnitaire: z.number().optional().nullable(),
  paiement: z.enum(["DIRECT", "CREDIT"]).default("DIRECT").optional().nullable(),
  typeAircraft: z.string().optional().nullable(),
  flightNumber: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  timeStart: z.string().optional().nullable(),
  timeEnd: z.string().optional().nullable(),
  linkDoc: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  depotId: z.string().optional().nullable(),
  produitId: z.string().optional().nullable(),
  tankId: z.string().optional().nullable(),
});

export const DeliverySchema = CreateDeliverySchema.extend({
  id: z.string(),
});

// Export types for use in components
export type Reception = z.infer<typeof ReceptionSchema>;
export type Delivery = z.infer<typeof DeliverySchema>;

