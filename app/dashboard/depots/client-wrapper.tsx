'use client';
import DataTables from "./data-table";

type DepotWithProducts = {
  id: string;
  name: string;
  type: "OWNED" | "EXTERNAL";
  location?: string | null;
  products?: Array<{ id: string; quantity: number; product?: { name: string; unit: string } }>;
};

export default function DataTablesWrapper({ Element }: { Element: DepotWithProducts[] }) {
  return <DataTables Element={Element} />;
}