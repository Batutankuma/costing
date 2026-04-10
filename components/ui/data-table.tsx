"use client";

import * as React from "react";

type Column = {
  id?: string | number;
  header?: string | ((props: Record<string, unknown>) => React.ReactNode);
  accessorKey?: string;
  cell?: (props: { row: { original: Record<string, unknown> } }) => React.ReactNode;
  [key: string]: unknown;
};

export function DataTable({ columns, data }: { columns: Column[]; data: Record<string, unknown>[] }) {
  return (
    <table className="min-w-full border">
      <thead>
        <tr>
          {columns.map((c, idx) => (
            <th key={typeof c.id === 'string' || typeof c.id === 'number' ? c.id : c.accessorKey || idx} className="border px-2 py-1 text-left">
              {typeof c.header === "function" ? c.header({}) : c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={typeof row.id === 'string' || typeof row.id === 'number' ? row.id : i}>
            {columns.map((c, idx) => (
              <td key={typeof c.id === 'string' || typeof c.id === 'number' ? c.id : c.accessorKey || idx} className="border px-2 py-1">
                {c.cell ? c.cell({ row: { original: row } }) : (c.accessorKey ? String(row[c.accessorKey] ?? '') : null)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}


