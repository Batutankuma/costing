'use client';

import DataTables from "./data-table";
import { Commande } from "./columns";

export default function DataTablesWrapper({ Element }: { Element: Commande[] }) {
  return <DataTables Element={Element} />;
}
