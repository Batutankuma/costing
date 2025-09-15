"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DeleteNonMiningPrice } from "./delete";

export type NonMiningPriceStructure = {
  id: string;
  nomStructure: string;
  description: string | null;
  cardinale: "SUD" | "NORD" | "EST" | "OUEST";
  pmfCommercialUSD: number;
  pmfCommercialCDF: number;
  priceRefCDF: number;
  priceRefUSD: number;
  priceRefUSDPerLitre: number;
  createdAt: Date;
  updatedAt: Date;
  user: {
    name: string;
    email: string;
  };
  exchangeRate: {
    rate: number;
    deviseBase: string;
    deviseTarget: string;
  };
  distributionCosts: {
    totalDistribution: number;
  } | null;
  securityStock: {
    totalSecurity: number;
  } | null;
  parafiscality: {
    foner: number;
    pmfFiscal: number;
  } | null;
  fiscality: {
    totalFiscality1: number;
    totalFiscality2: number;
  } | null;
  finalPricing: {
    appliedPriceCDF: number;
    appliedPriceUSD: number;
  } | null;
};

export const columns: ColumnDef<NonMiningPriceStructure>[] = [
  {
    accessorKey: "nomStructure",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Structure
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {row.getValue("nomStructure")}
        </div>
      );
    },
  },
  {
    accessorKey: "cardinale",
    header: "Zone",
    cell: ({ row }) => {
      const cardinale = row.getValue("cardinale") as string;
      return (
        <Badge variant="outline" className="capitalize">
          {cardinale}
        </Badge>
      );
    },
  },
  {
    accessorKey: "pmfCommercialCDF",
    header: "PMF Commercial",
    cell: ({ row }) => {
      const cdfAmount = parseFloat(row.getValue("pmfCommercialCDF"));
      const usdAmount = cdfAmount / (row.original.exchangeRate?.rate || 2500);
      
      const cdfFormatted = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "CDF",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(cdfAmount);
      
      const usdFormatted = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(usdAmount);
      
      return (
        <div className="space-y-1">
          <div className="font-medium">{cdfFormatted}</div>
          <div className="text-sm text-muted-foreground">{usdFormatted}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "priceRefCDF",
    header: "Prix Référence",
    cell: ({ row }) => {
      const cdfAmount = parseFloat(row.getValue("priceRefCDF"));
      const usdAmount = cdfAmount / (row.original.exchangeRate?.rate || 2500);
      
      const cdfFormatted = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "CDF",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(cdfAmount);
      
      const usdFormatted = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(usdAmount);
      
      return (
        <div className="space-y-1">
          <div className="font-medium text-primary">{cdfFormatted}</div>
          <div className="text-sm text-muted-foreground">{usdFormatted}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "finalPricing.appliedPriceCDF",
    header: "Prix Appliqué",
    cell: ({ row }) => {
      const finalPricing = row.original.finalPricing;
      if (!finalPricing) return <div>-</div>;
      
      const cdfFormatted = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "CDF",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(finalPricing.appliedPriceCDF);
      
      const usdFormatted = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }).format(finalPricing.appliedPriceUSD);
      
      return (
        <div className="space-y-1">
          <div className="font-bold text-green-600">{cdfFormatted}</div>
          <div className="text-sm font-semibold text-green-600">{usdFormatted}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "user.name",
    header: "Créé par",
    cell: ({ row }) => {
      const user = row.original.user;
      return (
        <div>
          <div className="font-medium">{user.name}</div>
          <div className="text-sm text-muted-foreground">{user.email}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date de création",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      return (
        <div className="text-sm">
          {format(new Date(date), "dd MMM yyyy", { locale: fr })}
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const priceStructure = row.original;

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
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(priceStructure.id)}
            >
              Copier l'ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href={`/dashboard/non-mining-prices/views/${priceStructure.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Voir
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={`/dashboard/non-mining-prices/${priceStructure.id}`}>
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <DeleteNonMiningPrice 
                id={priceStructure.id} 
                nomStructure={priceStructure.nomStructure} 
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
