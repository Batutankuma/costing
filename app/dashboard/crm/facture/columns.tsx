'use client';

import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye, Trash2, FileEdit } from "lucide-react";
import { ManualFacture } from "@/models/mvc";
import DeleteFactureButton from "./delete";

export type FactureRow = ManualFacture & { invoiceDate: Date };

type DeleteButtonProps = {
  id: string;
  invoiceNumber: string;
  children: React.ReactNode;
};

export function createManualFactureColumns(
  basePath: string,
  DeleteButton: React.ComponentType<DeleteButtonProps> = DeleteFactureButton
): ColumnDef<FactureRow>[] {
  return [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 30,
  },
  {
    header: "N° Facture",
    accessorKey: "invoiceNumber",
    size: 120,
    cell: ({ row }) => <span className="font-semibold">{row.original.invoiceNumber}</span>,
  },
  {
    header: "Client",
    accessorKey: "clientName",
    size: 180,
  },
  {
    header: "Date",
    accessorKey: "invoiceDate",
    size: 140,
    cell: ({ row }) => (
      <span>{row.original.invoiceDate ? new Date(row.original.invoiceDate).toLocaleDateString('fr-FR') : 'N/A'}</span>
    ),
  },
  {
    header: "Total",
    accessorKey: "total",
    size: 120,
    cell: ({ row }) => (
      <span className="font-medium">
        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: row.original.currency || 'USD' }).format(row.original.total)}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    enableHiding: false,
    size: 160,
    cell: ({ row }) => (
      <div className="flex items-center gap-2 justify-end">
        <Button asChild size="sm" variant="outline">
          <Link href={`${basePath}/views/${row.original.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`${basePath}/${row.original.id}`}>
            <FileEdit className="h-4 w-4" />
          </Link>
        </Button>
        <DeleteButton id={row.original.id} invoiceNumber={row.original.invoiceNumber}>
          <Button size="sm" variant="destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </DeleteButton>
      </div>
    ),
  },
];
}

export const columns = createManualFactureColumns("/dashboard/crm/facture");
