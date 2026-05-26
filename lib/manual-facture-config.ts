export type ManualFactureKind = "STANDARD" | "PROFORMA";

export type ManualFactureModuleConfig = {
  kind: ManualFactureKind;
  basePath: string;
  listTitle: string;
  listDescription: string;
  createLabel: string;
  documentLabel: string;
  printNumberLabel: string;
  numberPrefix: string;
};

export const MANUAL_FACTURE_CONFIG: Record<ManualFactureKind, ManualFactureModuleConfig> = {
  STANDARD: {
    kind: "STANDARD",
    basePath: "/dashboard/crm/facture",
    listTitle: "Factures",
    listDescription: "Enregistrez et visualisez vos factures saisies manuellement.",
    createLabel: "Nouvelle facture",
    documentLabel: "Facture",
    printNumberLabel: "N° FACTURE",
    numberPrefix: "",
  },
  PROFORMA: {
    kind: "PROFORMA",
    basePath: "/dashboard/crm/facture-proforma",
    listTitle: "Factures proforma",
    listDescription: "Enregistrez et visualisez vos factures proforma.",
    createLabel: "Nouvelle facture proforma",
    documentLabel: "Facture proforma",
    printNumberLabel: "N° FACTURE PROFORMA",
    numberPrefix: "PRO-",
  },
};
