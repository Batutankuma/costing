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

export type TransporteurWithRelations = {
  id: string;
  nom: string;
  description?: string | null;
  adresse?: string | null;
  contactTelephone?: string | null;
  mail?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const multiColumnFilterFn: FilterFn<TransporteurWithRelations> = (row, columnId, filterValue) => {
  const searchable = `${row.original.nom} ${row.original.mail || ""} ${row.original.contactTelephone || ""}`.toLowerCase();
  return searchable.includes((filterValue ?? "").toLowerCase());
};

export const columns: ColumnDef<TransporteurWithRelations>[] = [
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
  {
    header: "Nom",
    accessorKey: "nom",
    cell: ({ row }) => <div className="font-medium">{row.getValue("nom")}</div>,
    filterFn: multiColumnFilterFn,
    enableHiding: false,
    size: 180,
  },
  {
    header: "Description",
    accessorKey: "description",
    cell: ({ row }) => <div className="max-w-[220px] truncate">{row.original.description || "N/A"}</div>,
    size: 220,
  },
  {
    header: "Adresse",
    accessorKey: "adresse",
    cell: ({ row }) => <div className="max-w-[220px] truncate">{row.original.adresse || "N/A"}</div>,
    size: 220,
  },
  {
    header: "Téléphone",
    accessorKey: "contactTelephone",
    cell: ({ row }) => <div>{row.original.contactTelephone || "N/A"}</div>,
    size: 150,
  },
  {
    header: "Mail",
    accessorKey: "mail",
    cell: ({ row }) => <div>{row.original.mail || "N/A"}</div>,
    size: 180,
  },
  {
    header: "Créé le",
    accessorKey: "createdAt",
    size: 140,
    cell: ({ row }) => <div>{(row.getValue("createdAt") as Date).toLocaleDateString("fr-FR")}</div>,
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => <RowActions row={row} />,
    size: 60,
    enableHiding: false,
  },
];

function RowActions({ row }: { row: Row<TransporteurWithRelations> }) {
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
            <Link href={`/dashboard/transport/${row.original.id}`}>
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
      <RemoveDialog open={openRemoveDialog} setOpen={setOpenRemoveDialog} Id={row.original.id} nameClient={row.original.nom} />
    </DropdownMenu>
  );
}
