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
import { Ellipsis, Eye, Edit } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import RemoveDialog from "./delete";
import { Badge } from "@/components/ui/badge";

// Type pour NonMiningBuilder avec relations Prisma
export type NonMiningBuilderWithRelations = {
    id: string;
    title: string;
    description?: string | null;
    unit: string;
    createdAt: Date;
    updatedAt: Date;
    user: {
        name: string;
        email: string;
    };
    nonMiningPriceStructure?: {
        nomStructure: string;
        exchangeRate: {
            rate: number;
            deviseBase: string;
            deviseTarget: string;
        };
    } | null;
    totals?: {
        priceDDUUSD?: number | null;
        priceDDPUSD?: number | null;
    } | null;
};

// La fonction de filtre utilise des champs disponibles avec relations
const multiColumnFilterFn: FilterFn<NonMiningBuilderWithRelations> = (row, columnId, filterValue) => {
    const searchableRowContent = `${row.original.title} ${row.original.description || ''} ${row.original.user?.name || ''}`.toLowerCase();
    const searchTerm = (filterValue ?? "").toLowerCase();
    return searchableRowContent.includes(searchTerm);
};

// La définition des colonnes est mise à jour
export const columns: ColumnDef<NonMiningBuilderWithRelations>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
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
    {
        header: "Titre",
        accessorKey: "title",
        cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
        size: 250,
        filterFn: multiColumnFilterFn,
        enableHiding: false,
    },
    {
        header: "Structure Non-Minier",
        accessorKey: "nonMiningPriceStructure.nomStructure",
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
                <span className="text-muted-foreground">N/A</span>
            );
        },
        size: 200,
    },
    {
        header: "Unité",
        accessorKey: "unit",
        size: 120,
        cell: ({ row }) => {
            const unit = row.getValue("unit") as string;
            return (
                <Badge variant="outline">
                    {unit === "USD_M3" ? "USD/M³" : "USD/Litre"}
                </Badge>
            );
        },
    },
    {
        header: "Prix DDP (USD)",
        accessorKey: "totals.priceDDPUSD",
        size: 150,
        cell: ({ row }) => {
            const pricing = row.original.totals;
            return pricing?.priceDDPUSD ? (
                <div className="font-semibold text-right">
                    ${pricing.priceDDPUSD.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}
                </div>
            ) : (
                <span className="text-muted-foreground">N/A</span>
            );
        },
    },
    {
        header: "Prix DDU (USD)",
        accessorKey: "totals.priceDDUUSD",
        size: 150,
        cell: ({ row }) => {
            const pricing = row.original.totals;
            return pricing?.priceDDUUSD ? (
                <div className="font-semibold text-right">
                    ${pricing.priceDDUUSD.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}
                </div>
            ) : (
                <span className="text-muted-foreground">N/A</span>
            );
        },
    },
    {
        header: "Créé par",
        accessorKey: "user.name",
        cell: ({ row }) => <div>{row.original.user?.name || "N/A"}</div>,
        size: 150,
    },
    {
        header: "Créé le",
        accessorKey: "createdAt",
        size: 150,
        cell: ({ row }) => {
            const date = row.getValue("createdAt") as Date;
            return <div>{date.toLocaleDateString('fr-FR')}</div>;
        },
    },
    {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => <RowActions row={row} />,
        size: 60,
        enableHiding: false,
    },
];

function RowActions({ row }: { row: Row<NonMiningBuilderWithRelations> }) {
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
                        <Link href={`/dashboard/non-mining-builders/views/${row.original.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>Voir</span>
                            <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/non-mining-builders/${row.original.id}`}>
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
            <RemoveDialog open={openRemoveDialog} setOpen={setOpenRemoveDialog} Id={row.original.id} nameClient={row.original.title} />
        </DropdownMenu>
    );
}

