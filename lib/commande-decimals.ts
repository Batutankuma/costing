/** Nombre de décimales pour quantite, unitPrice et tva sur Commande */
export const COMMANDE_DECIMAL_PLACES = 4;

const DECIMAL_MESSAGE = `Maximum ${COMMANDE_DECIMAL_PLACES} chiffres après la virgule`;

export function roundCommandeDecimal(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** COMMANDE_DECIMAL_PLACES;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function hasAtMostCommandeDecimals(value: number): boolean {
  if (!Number.isFinite(value)) return false;
  return Math.abs(value - roundCommandeDecimal(value)) < 1e-9;
}

export const commandeDecimalRefine = {
  check: hasAtMostCommandeDecimals,
  message: DECIMAL_MESSAGE,
};

/** Sérialise les champs Decimal Prisma en number pour le client */
export function commandeDecimalsToNumber<T extends {
  quantite: unknown;
  unitPrice?: unknown | null;
  tva?: unknown | null;
}>(row: T): T & { quantite: number; unitPrice: number | null; tva: number | null } {
  return {
    ...row,
    quantite: Number(row.quantite),
    unitPrice: row.unitPrice != null ? Number(row.unitPrice) : null,
    tva: row.tva != null ? Number(row.tva) : null,
  };
}
