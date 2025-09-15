"use client";

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

export type PriceRow = {
  id: string;
  date: string;
  nomStructure: string;
  pmfCommercialUSD: number;
  priceRefCDF: number;
  priceRefUSD: number;
  priceRefUSDPerLitre: number;
};

const multiColumnFilterFn: FilterFn<PriceRow> = (row, _columnId, filterValue) => {
  const haystack = `${row.original.nomStructure} ${row.original.date}`.toLowerCase();
  const needle = String(filterValue ?? "").toLowerCase();
  return haystack.includes(needle);
};

export const columns: ColumnDef<PriceRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
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
  { header: "Date", accessorKey: "date", size: 120 },
  {
    header: "Structure",
    accessorKey: "nomStructure",
    cell: ({ row }) => <div className="font-medium">{row.getValue("nomStructure") as string}</div>,
    filterFn: multiColumnFilterFn,
    enableHiding: false,
    size: 220,
  },
  {
    header: "PMF (USD/M3)",
    accessorKey: "pmfCommercialUSD",
    cell: ({ row }) => Number(row.getValue("pmfCommercialUSD") ?? 0).toLocaleString("fr-FR"),
    size: 160,
  },
  {
    header: "Prix réf CDF / M3",
    accessorKey: "priceRefCDF",
    cell: ({ row }) => Number(row.getValue("priceRefCDF") ?? 0).toLocaleString("fr-FR"),
    size: 170,
  },
  {
    header: "Prix réf USD / M3",
    accessorKey: "priceRefUSD",
    cell: ({ row }) => Number(row.getValue("priceRefUSD") ?? 0).toLocaleString("fr-FR"),
    size: 170,
  },
  {
    header: "Prix réf USD / Litre",
    accessorKey: "priceRefUSDPerLitre",
    cell: ({ row }) => Number(row.getValue("priceRefUSDPerLitre") ?? 0).toLocaleString("fr-FR"),
    size: 180,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <PriceRowActionsInternal row={row} />,
    size: 60,
    enableHiding: false,
  },
];

function PriceRowActionsInternal({ row }: { row: Row<PriceRow> }) {
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false);
  const { id, nomStructure } = row.original;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex justify-end">
          <Button size="icon" variant="ghost" className="shadow-none" aria-label="Actions">
            <Ellipsis size={16} strokeWidth={2} aria-hidden="true" />
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/prices/views/${id}`}>
              <span>Voir</span>
              <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/prices/${id}`}>
              <span>Modification</span>
              <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive" onClick={() => setOpenRemoveDialog(true)}>
          <span>Supprimer</span>
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
      <RemoveDialog Id={id} nameClient={nomStructure} open={openRemoveDialog} onOpenChange={setOpenRemoveDialog} />
    </DropdownMenu>
  );
}

export function RowActions({ id, nomStructure }: { id: string; nomStructure: string }) {
  const [openRemoveDialog, setOpenRemoveDialog] = useState(false);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex justify-end">
          <Button size="icon" variant="ghost" className="shadow-none" aria-label="Actions">
            <Ellipsis size={16} strokeWidth={2} aria-hidden="true" />
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/prices/views/${id}`}>
              <span>Voir</span>
              <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/prices/${id}`}>
              <span>Modification</span>
              <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive" onClick={() => setOpenRemoveDialog(true)}>
          <span>Supprimer</span>
          <DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
      <RemoveDialog Id={id} nameClient={nomStructure} open={openRemoveDialog} onOpenChange={setOpenRemoveDialog} />
    </DropdownMenu>
  );
}
