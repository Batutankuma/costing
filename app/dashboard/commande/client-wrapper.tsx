'use client';

import DataTables from "./data-table";

export default function DataTablesWrapper({ Element }: { Element: Record<string, unknown>[] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <DataTables Element={Element as any} />;
}
