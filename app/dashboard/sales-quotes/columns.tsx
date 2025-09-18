"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";

export type SalesQuote = {
  id: string;
  createdAt: string | Date;
  proformaNumber?: string | null;
  user?: { name?: string | null } | null;
  totalDDUUSD?: number | null;
  totalDDPUSD?: number | null;
  client?: { name?: string | null } | null;
};

export const columns: ColumnDef<SalesQuote>[] = [
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.original.createdAt ? new Date(row.original.createdAt) : null;
      return date ? date.toLocaleDateString("fr-FR") : "—";
    },
  },
  {
    accessorKey: "proformaNumber",
    header: "N° Proforma",
    cell: ({ row }) => row.original.proformaNumber || "—",
  },
  {
    accessorKey: "user.name",
    header: "Auteur",
    cell: ({ row }) => row.original.user?.name || "—",
  },
  {
    accessorKey: "totalDDUUSD",
    header: "DDU (USD)",
    cell: ({ row }) => {
      const amount = row.original.totalDDUUSD || 0;
      return amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 });
    },
  },
  {
    accessorKey: "totalDDPUSD",
    header: "DDP (USD)",
    cell: ({ row }) => {
      const amount = row.original.totalDDPUSD || 0;
      return amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 });
    },
  },
  {
    accessorKey: "client.name",
    header: "Client",
    cell: ({ row }) => row.original.client?.name || "—",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const quote = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Ouvrir le menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/sales-quotes/${quote.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Voir
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/sales-quotes/${quote.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];


