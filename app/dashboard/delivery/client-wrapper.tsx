'use client';

import DataTables from "./data-table";
import { DeliveryWithRelations } from "./columns";

export default function DataTablesWrapper({ Element }: { Element: DeliveryWithRelations[] }) {
  return <DataTables Element={Element} />;
}
