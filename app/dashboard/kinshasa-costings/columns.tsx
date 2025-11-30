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
import { Ellipsis, Eye, Edit } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import RemoveDialog from "./delete";

export type KinshasaCostingRow = {
  id: string;
  title: string;
  currency: "USD" | "CDF";
  volumeM3: number;
  unitPriceUsd: number;
  product: { id: string; name: string };
  updatedAt: Date;
};

const multiColumnFilter: FilterFn<KinshasaCostingRow> = (row, _columnId, filterValue) => {
  const target = `${row.original.title} ${row.original.product?.name ?? ""}`.toLowerCase();
  const term = String(filterValue ?? "").toLowerCase();
  return target.includes(term);
};

export const columns: ColumnDef<KinshasaCostingRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Sélectionner tout"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Sélectionner une ligne"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 28,
  },
  {
    header: "Titre",
    accessorKey: "title",
    cell: ({ row }) => <span className="font-medium text-foreground">{row.getValue("title")}</span>,
    filterFn: multiColumnFilter,
    enableHiding: false,
  },
  {
    header: "Produit",
    accessorKey: "product.name",
    cell: ({ row }) => <span className="text-muted-foreground">{row.original.product?.name ?? "—"}</span>,
    filterFn: multiColumnFilter,
  },
  {
    header: "Devise",
    accessorKey: "currency",
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-semibold uppercase">
        {row.getValue("currency")}
      </span>
    ),
    size: 80,
  },
  {
    header: "Volume (m³)",
    accessorKey: "volumeM3",
    cell: ({ row }) => <span>{Number(row.getValue("volumeM3") ?? 0).toLocaleString("fr-FR")}</span>,
    size: 120,
  },
  {
    header: "Prix unit. USD",
    accessorKey: "unitPriceUsd",
    cell: ({ row }) => {
      const val = Number(row.getValue("unitPriceUsd") ?? 0);
      return <span className="font-semibold">${val.toFixed(2)}</span>;
    },
    size: 140,
  },
  {
    header: "Mis à jour",
    accessorKey: "updatedAt",
    cell: ({ row }) => {
      const date = row.getValue("updatedAt") as Date;
      return <span>{date ? new Date(date).toLocaleDateString("fr-FR") : "—"}</span>;
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    enableHiding: false,
    cell: ({ row }) => <RowActions row={row} />,
    size: 60,
  },
];

function RowActions({ row }: { row: Row<KinshasaCostingRow> }) {
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
            <Link href={`/dashboard/kinshasa-costings/views/${row.original.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              <span>Voir</span>
              <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/kinshasa-costings/${row.original.id}`}>
              <Edit className="mr-2 h-4 w-4" />
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
      <RemoveDialog
        open={openRemoveDialog}
        setOpen={setOpenRemoveDialog}
        id={row.original.id}
        title={row.original.title}
      />
    </DropdownMenu>
  );
}

