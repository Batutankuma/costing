'use client';

import DataTables from "./data-table";
import { Delivery } from "@/models/mvc";

export default function DataTablesWrapper({ Element }: { Element: Delivery[] }) {
  return <DataTables Element={Element} />;
}
