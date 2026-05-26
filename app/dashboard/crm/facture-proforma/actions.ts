"use server";

import { createManualFactureActions } from "../_lib/manual-facture-actions";

const proforma = createManualFactureActions("PROFORMA");

export const createFactureAction = proforma.createFactureAction;
export const getNextInvoiceNumberAction = proforma.getNextInvoiceNumberAction;
export const listCommandeReferencesAction = proforma.listCommandeReferencesAction;
export const getAutoFactureFromCommandeAction = proforma.getAutoFactureFromCommandeAction;
export const findFactureById = proforma.findFactureById;
export const findAllFacturesAction = proforma.findAllFacturesAction;
export const updateFactureAction = proforma.updateFactureAction;
export const removeFactureAction = proforma.removeFactureAction;
