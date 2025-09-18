"use client";

import { DataTable as UiDataTable } from "@/components/ui/data-table";
import { columns, type SalesQuote } from "./columns";

export default function DataTable({ items }: { items: SalesQuote[] }) {
  return <UiDataTable columns={columns} data={items} />;
}


