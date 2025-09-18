"use client";

import { DataTable as UiDataTable } from "@/components/ui/data-table";
import { columns, type Prospect } from "./columns";

export function ProspectsDataTable({ data }: { data: Prospect[] }) {
  return <UiDataTable columns={columns} data={data} />;
}
