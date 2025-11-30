'use client';
import DataTables from "./data-table";
import { Depot } from "@/models/mvc";
export default function DataTablesWrapper({ Element }: { Element: Depot[] }) {
  return <DataTables Element={Element} />;
} 
