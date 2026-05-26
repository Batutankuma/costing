"use server";

import { createManualFactureActions } from "../_lib/manual-facture-actions";

const standard = createManualFactureActions("STANDARD");

export const createFactureAction = standard.createFactureAction;
export const getNextInvoiceNumberAction = standard.getNextInvoiceNumberAction;
export const listCommandeReferencesAction = standard.listCommandeReferencesAction;
export const getAutoFactureFromCommandeAction = standard.getAutoFactureFromCommandeAction;
export const findFactureById = standard.findFactureById;
export const findAllFacturesAction = standard.findAllFacturesAction;
export const updateFactureAction = standard.updateFactureAction;
export const removeFactureAction = standard.removeFactureAction;
