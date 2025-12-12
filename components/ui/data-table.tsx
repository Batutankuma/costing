"use client";

import * as React from "react";

type Column = {
  header?: string;
  accessorKey?: string;
  [key: string]: unknown;
};

export function DataTable({ columns, data }: { columns: Column[]; data: Record<string, unknown>[] }) {
  return (
    <table className="min-w-full border">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.id || c.accessorKey} className="border px-2 py-1 text-left">
              {typeof c.header === "function" ? c.header({}) : c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={row.id || i}>
            {columns.map((c) => (
              <td key={c.id || c.accessorKey} className="border px-2 py-1">
                {c.cell ? c.cell({ row: { original: row } }) : row[c.accessorKey]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}


