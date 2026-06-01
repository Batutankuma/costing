/** Affichage des montants et quantités sur factures / proforma */
export const MANUAL_FACTURE_DECIMAL_PLACES = 2;

const numberFormatOptions: Intl.NumberFormatOptions = {
  minimumFractionDigits: MANUAL_FACTURE_DECIMAL_PLACES,
  maximumFractionDigits: MANUAL_FACTURE_DECIMAL_PLACES,
};

export function formatManualFactureNumber(
  value: number | string | null | undefined
): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) {
    return (0).toLocaleString("fr-FR", numberFormatOptions);
  }
  return n.toLocaleString("fr-FR", numberFormatOptions);
}

export function formatManualFactureCurrency(
  value: number | string | null | undefined,
  currency = "USD"
): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    ...numberFormatOptions,
  }).format(Number.isFinite(n) ? n : 0);
}

/** Parse une saisie avec virgule ou point (ex. "12,50" → 12.5) */
export function parseManualFactureDecimalInput(value: string): number {
  if (!value || value.trim() === "") return 0;
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const n = parseFloat(normalized);
  if (!Number.isFinite(n)) return 0;
  const factor = 10 ** MANUAL_FACTURE_DECIMAL_PLACES;
  return Math.round(n * factor) / factor;
}

/** Valeur initiale pour un champ texte décimal */
export function formatManualFactureDecimalInput(
  value: number | string | null | undefined
): string {
  if (value === "" || value == null) return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return formatManualFactureNumber(n);
}

export function roundManualFactureDecimal(value: number): number {
  const factor = 10 ** MANUAL_FACTURE_DECIMAL_PLACES;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}
