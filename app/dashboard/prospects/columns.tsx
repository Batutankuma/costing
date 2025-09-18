"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export type Prospect = {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  stage: "NEW" | "CONTACTED" | "QUALIFIED" | "WON" | "LOST";
  notes?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

const stageVariantByStage: Record<Prospect["stage"], "default" | "secondary" | "destructive" | "outline"> = {
  NEW: "default",
  CONTACTED: "outline",
  QUALIFIED: "secondary",
  WON: "default",
  LOST: "destructive",
};

const stageLabels = {
  NEW: "Nouveau",
  CONTACTED: "Contacté", 
  QUALIFIED: "Qualifié",
  WON: "Gagné",
  LOST: "Perdu"
};

export const columns: ColumnDef<Prospect>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc") }>
        Nom
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "company",
    header: "Société",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "phone",
    header: "Téléphone",
  },
  {
    accessorKey: "source",
    header: "Source",
  },
  {
    accessorKey: "stage",
    header: "Étape",
    cell: ({ row }) => (
      <Badge variant={stageVariantByStage[row.original.stage]}> 
        {stageLabels[row.original.stage as keyof typeof stageLabels]}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Créé le",
    cell: ({ row }) => {
      const date = row.original.createdAt ? new Date(row.original.createdAt) : null;
      return date ? date.toLocaleDateString("fr-FR") : "—";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const prospect = row.original;
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
              <Link href={`/dashboard/prospects/${prospect.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Voir
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/prospects/${prospect.id}/edit`}>
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
