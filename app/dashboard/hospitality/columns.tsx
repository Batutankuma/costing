'use client';

import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef, FilterFn, Row } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Ellipsis } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import RemoveDialog from "./delete";

export type HospitalityWithRelations = {
  id: string;
  driverName: string;
  truckNo: string;
  trailerNo: string;
  supplier: { id: string; nom: string };
  transporter: { id: string; nom: string };
  depot: { id: string; name: string };
  commande?: { id: string; reference: string } | null;
  quantityOrder: number;
  offlQty20: number;
  varianceQty20: number;
  transitAllowableLoss: number;
  disAllowableLoss: number;
  rate: number;
  total: number;
  createdAt: Date;
};

const multiColumnFilterFn: FilterFn<HospitalityWithRelations> = (row, columnId, filterValue) => {
  const searchable = `${row.original.driverName} ${row.original.truckNo} ${row.original.trailerNo}`.toLowerCase();
  return searchable.includes((filterValue ?? "").toLowerCase());
};

function format2(value: number) {
  return Number(value).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const columns: ColumnDef<HospitalityWithRelations>[] = [
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
    size: 28,
    enableSorting: false,
    enableHiding: false,
  },
  { header: "Driver s name", accessorKey: "driverName", filterFn: multiColumnFilterFn, enableHiding: false, size: 150, cell: ({ row }) => <span className="text-xs truncate block max-w-[140px]">{row.original.driverName}</span> },
  { header: "Supplier", id: "supplier", cell: ({ row }) => <span className="text-xs truncate block max-w-[120px]">{row.original.supplier.nom}</span>, size: 130 },
  { header: "Transporter", id: "transporter", cell: ({ row }) => <span className="text-xs truncate block max-w-[120px]">{row.original.transporter.nom}</span>, size: 130 },
  { header: "Commande", id: "commande", cell: ({ row }) => <span className="text-xs truncate block max-w-[130px]">{row.original.commande?.reference ?? "N/A"}</span>, size: 140 },
  { header: "Truck No.", accessorKey: "truckNo", size: 105, cell: ({ row }) => <span className="text-xs">{row.original.truckNo}</span> },
  { header: "Trailer No.", accessorKey: "trailerNo", size: 105, cell: ({ row }) => <span className="text-xs">{row.original.trailerNo}</span> },
  { header: "Depot", id: "depot", cell: ({ row }) => <span className="text-xs truncate block max-w-[120px]">{row.original.depot.name}</span>, size: 130 },
  { header: "QTY Order", accessorKey: "quantityOrder", size: 110, cell: ({ row }) => <span className="text-xs">{format2(row.original.quantityOrder)}</span> },
  { header: "OFFL QTY @20", accessorKey: "offlQty20", size: 110, cell: ({ row }) => <span className="text-xs">{format2(row.original.offlQty20)}</span> },
  { header: "Variance", accessorKey: "varianceQty20", size: 110, cell: ({ row }) => <span className="text-xs">{format2(row.original.varianceQty20)}</span> },
  {
    header: "Dis-Allowable LOSS",
    accessorKey: "disAllowableLoss",
    size: 150,
    cell: ({ row }) => {
      const value = row.original.disAllowableLoss;
      return (
        <span className={value > 0 ? "text-destructive font-semibold" : ""}>
          {format2(value)}
        </span>
      );
    },
  },
  { header: "Rate ($)", accessorKey: "rate", size: 95, cell: ({ row }) => <span className="text-xs">{format2(row.original.rate)}</span> },
  { header: "Total ($)", accessorKey: "total", size: 110, cell: ({ row }) => <span className="text-xs">{format2(row.original.total)}</span> },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <RowActions row={row} />,
    size: 60,
    enableHiding: false,
  },
];

function RowActions({ row }: { row: Row<HospitalityWithRelations> }) {
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex justify-end">
          <Button size="icon" variant="ghost" className="shadow-none" aria-label="Edit item">
            <Ellipsis size={16} strokeWidth={2} aria-hidden="true" />
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/hospitality/views/${row.original.id}`}>
              <span>Voir</span>
              <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/hospitality/${row.original.id}`}>
              <span>Modifier</span>
              <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="text-destructive focus:text-destructive"
          onClick={() => setOpenRemoveDialog(true)}
        >
          <span>Supprimer</span>
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
      <RemoveDialog open={openRemoveDialog} setOpen={setOpenRemoveDialog} Id={row.original.id} nameClient={row.original.driverName} />
    </DropdownMenu>
  );
}
