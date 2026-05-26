'use client';

import { createManualFactureColumns, type FactureRow } from "../facture/columns";
import DeleteFactureButton from "./delete";
import { MANUAL_FACTURE_CONFIG } from "@/lib/manual-facture-config";

export type { FactureRow };

export const columns = createManualFactureColumns(
  MANUAL_FACTURE_CONFIG.PROFORMA.basePath,
  DeleteFactureButton
);
