'use client';

import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef, Row } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Ellipsis } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import RemoveDialog from "./delete";

export type ClientOrderWithRelations = {
  id: string;
  reference: string;
  date: Date;
  status: "DRAFT" | "CONFIRMED" | "PARTIALLY_RECEIVED" | "COMPLETED" | "CANCELLED";
  quantity: number;
  unitPrice: number;
  devise: string;
  client: { name?: string | null; company?: string | null };
  produit: { name: string };
  orderedQty?: number;
  receivedQty?: number;
  remainingQty?: number;
  reliquat?: number;
  perte?: number;
};

function format2(value: number) {
  return Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const columns: ColumnDef<ClientOrderWithRelations>[] = [
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
    size: 28,
  },
  { header: "Reference", accessorKey: "reference", size: 150 },
  {
    header: "Date",
    accessorKey: "date",
    cell: ({ row }) => <span>{new Date(row.original.date).toLocaleDateString("fr-FR")}</span>,
    size: 110,
  },
  {
    header: "Client",
    accessorKey: "client",
    cell: ({ row }) => (
      <span className="truncate block max-w-[180px]">{row.original.client.company || row.original.client.name || "-"}</span>
    ),
    size: 180,
  },
  {
    header: "Produit",
    accessorKey: "produit",
    cell: ({ row }) => <span className="truncate block max-w-[140px]">{row.original.produit.name}</span>,
    size: 140,
  },
  {
    header: "Qte commandee",
    accessorKey: "orderedQty",
    cell: ({ row }) => <span>{format2(row.original.orderedQty || 0)}</span>,
    size: 120,
  },
  {
    header: "Qte recue",
    accessorKey: "receivedQty",
    cell: ({ row }) => <span>{format2(row.original.receivedQty || 0)}</span>,
    size: 110,
  },
  {
    header: "Qte restante",
    accessorKey: "remainingQty",
    cell: ({ row }) => <span>{format2(row.original.remainingQty ?? row.original.reliquat ?? 0)}</span>,
    size: 120,
  },
  {
    header: "Perte",
    accessorKey: "perte",
    cell: ({ row }) => <span>{format2(row.original.perte || 0)}</span>,
    size: 100,
  },
  {
    header: "P.U",
    accessorKey: "unitPrice",
    cell: ({ row }) => <span>{format2(row.original.unitPrice || 0)}</span>,
    size: 100,
  },
  { header: "Devise", accessorKey: "devise", size: 90 },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <RowActions row={row} />,
    enableHiding: false,
    size: 60,
  },
];

function RowActions({ row }: { row: Row<ClientOrderWithRelations> }) {
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="shadow-none">
          <Ellipsis size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/client-orders/views/${row.original.id}`}>Voir</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/client-orders/${row.original.id}`}>Modifier</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="text-destructive focus:text-destructive"
          onClick={() => setOpenRemoveDialog(true)}
        >
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
      <RemoveDialog
        open={openRemoveDialog}
        setOpen={setOpenRemoveDialog}
        Id={row.original.id}
        nameClient={row.original.reference}
      />
    </DropdownMenu>
  );
}
