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
  stock: { id: string; reference: string };
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
  { header: "Driver s name", accessorKey: "driverName", filterFn: multiColumnFilterFn, enableHiding: false, size: 180 },
  { header: "Supplier", id: "supplier", cell: ({ row }) => row.original.supplier.nom, size: 150 },
  { header: "Transporter", id: "transporter", cell: ({ row }) => row.original.transporter.nom, size: 150 },
  { header: "Stock", id: "stock", cell: ({ row }) => row.original.stock.reference, size: 140 },
  { header: "Truck No.", accessorKey: "truckNo", size: 120 },
  { header: "Trailer No.", accessorKey: "trailerNo", size: 120 },
  { header: "Depot", id: "depot", cell: ({ row }) => row.original.depot.name, size: 140 },
  { header: "QTY Order", accessorKey: "quantityOrder", size: 120 },
  { header: "OFFL QTY @20", accessorKey: "offlQty20", size: 120 },
  { header: "Variance", accessorKey: "varianceQty20", size: 120 },
  {
    header: "Dis-Allowable LOSS",
    accessorKey: "disAllowableLoss",
    size: 150,
    cell: ({ row }) => {
      const value = row.original.disAllowableLoss;
      return (
        <span className={value > 0 ? "text-destructive font-semibold" : ""}>
          {value}
        </span>
      );
    },
  },
  { header: "Rate ($)", accessorKey: "rate", size: 100 },
  { header: "Total ($)", accessorKey: "total", size: 120 },
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
