"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/data-table";
import Link from "next/link";
import { DeleteClient } from "./delete";

export type Client = {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt?: string | Date;
};

export function ClientsDataTable({ data }: { data: Client[] }) {
  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Nom<ArrowUpDown className="ml-2 h-4 w-4" /></Button>
      ),
    },
    { accessorKey: "company", header: "Société" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Téléphone" },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => <span className="text-xs px-2 py-1 rounded bg-muted">{row.original.status}</span>,
    },
    {
      accessorKey: "createdAt",
      header: "Créé le",
      cell: ({ row }) => {
        const d = row.original.createdAt ? new Date(row.original.createdAt) : null;
        return d ? d.toLocaleDateString("fr-FR", { year: "numeric", month: "short", day: "numeric" }) : "";
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const c = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Ouvrir le menu</span><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/clients/${c.id}`}><Edit className="mr-2 h-4 w-4" />Modifier</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <DeleteClient id={c.id} name={c.name} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={data} />;
}










