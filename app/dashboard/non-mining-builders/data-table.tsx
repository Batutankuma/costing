"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/ui/data-table";
import Link from "next/link";
import { DeleteNonMiningBuilder } from "./delete";

interface NonMiningBuilder {
  id: string;
  title: string;
  description: string | null;
  unit: string;
  createdAt: Date;
  user: {
    name: string;
    email: string;
  };
  nonMiningPriceStructure: {
    nomStructure: string;
    exchangeRate: {
      rate: number;
      deviseBase: string;
      deviseTarget: string;
    };
  } | null;
  totals: {
    priceDDUUSD: number | null;
    priceDDPUSD: number | null;
  } | null;
}

interface NonMiningBuildersDataTableProps {
  data: NonMiningBuilder[];
}

export function NonMiningBuildersDataTable({ data }: NonMiningBuildersDataTableProps) {
  const columns: ColumnDef<NonMiningBuilder>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Titre
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "nonMiningPriceStructure.nomStructure",
      header: "Structure Non-Minier",
      cell: ({ row }) => {
        const structure = row.original.nonMiningPriceStructure;
        return structure ? (
          <div>
            <div className="font-medium">{structure.nomStructure}</div>
            <div className="text-sm text-muted-foreground">
              Taux: {structure.exchangeRate.rate} {structure.exchangeRate.deviseBase}/{structure.exchangeRate.deviseTarget}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">Aucune structure</span>
        );
      },
    },
    {
      accessorKey: "unit",
      header: "Unité",
      cell: ({ row }) => {
        const unit = row.original.unit;
        return (
          <Badge variant="outline">
            {unit === "USD_M3" ? "USD/M³" : "USD/Litre"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "totals.priceDDPUSD",
      header: "Prix DDP (USD)",
      cell: ({ row }) => {
        const pricing = row.original.totals;
        return pricing ? (
          <div className="text-right">
            <div className="font-medium">
              {(pricing.priceDDPUSD ?? 0).toLocaleString("fr-FR", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
              })}
            </div>
            <div className="text-sm text-muted-foreground">
              DDU: {(pricing.priceDDUUSD ?? 0).toLocaleString("fr-FR", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
              })}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">Non calculé</span>
        );
      },
    },
    {
      accessorKey: "user.name",
      header: "Créé par",
    },
    {
      accessorKey: "createdAt",
      header: "Date de création",
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return date.toLocaleDateString("fr-FR", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const builder = row.original;

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
                <Link href={`/dashboard/non-mining-builders/views/${builder.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Voir
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/non-mining-builders/${builder.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <DeleteNonMiningBuilder id={builder.id} title={builder.title} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return <DataTable columns={columns} data={data} />;
}
