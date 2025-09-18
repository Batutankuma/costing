"use server";

import prisma from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";

const storePath = path.join(process.cwd(), "temp-storage.json");
async function readStore() { 
  try { 
    return JSON.parse(await fs.readFile(storePath, "utf8")); 
  } catch { 
    return {}; 
  } 
}

export async function getProspects() {
  try {
    if ((prisma as any)?.prospect) {
      const prospects = await (prisma as any).prospect.findMany({ 
        orderBy: { createdAt: "desc" } 
      });
      return prospects;
    }
    
    const store = await readStore();
    const prospects = Array.isArray(store.prospects) ? store.prospects : [];
    return prospects;
  } catch (error) {
    console.error("Error fetching prospects:", error);
    return [];
  }
}
