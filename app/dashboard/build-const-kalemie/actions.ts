"use server";

// Ce module s'appuie sur les actions génériques des builders
// et applique simplement un filtrage/route spécifique à Kalemie.

import { createBuilder, updateBuilder, listBuilders, findBuilderById, removeBuilderById } from "@/app/dashboard/builders/actions";

export { createBuilder, updateBuilder, findBuilderById as getKalemieBuilderById, removeBuilderById as deleteKalemieBuilder };

export async function listKalemieBuilders() {
  const res = await listBuilders();
  const items = (res as any)?.data?.result ?? [];
  // Filtrer par titre/description contenant Kalemie ou le tag #kalemie
  const filtered = (items ?? []).filter((it: any) => {
    const t = `${it?.title ?? ""} ${it?.description ?? ""}`.toLowerCase();
    return t.includes("kalemie") || t.includes("#kalemie");
  });
  return { success: true, result: filtered } as const;
}


