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

// Type pour Builder avec relations Prisma
export type BuilderWithRelations = {
    id: string;
    date: Date;
    title: string;
    unit: string;
    description?: string | null;
    createdAt: Date;
    updatedAt: Date;
    priceReference?: {
        nomStructure: string;
    } | null;
    nonMiningPriceStructure?: {
        nomStructure: string;
    } | null;
    totals?: {
        priceDDUUSD?: number | null;
        priceDDPUSD?: number | null;
    } | null;
};

// La fonction de filtre utilise des champs disponibles
const multiColumnFilterFn: FilterFn<BuilderWithRelations> = (row, columnId, filterValue) => {
    const searchableRowContent = `${row.original.title} ${row.original.description || ''}`.toLowerCase();
    const searchTerm = (filterValue ?? "").toLowerCase();
    return searchableRowContent.includes(searchTerm);
};

// La définition des colonnes
export const columns: ColumnDef<BuilderWithRelations>[] = [
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
        header: "Date",
        accessorKey: "date",
        size: 150,
        cell: ({ row }) => {
            const date = row.getValue("date") as Date;
            return <div>{date.toLocaleDateString('fr-FR')}</div>;
        },
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
        header: "Unité",
        accessorKey: "unit",
        size: 100,
        cell: ({ row }) => {
            const unit = row.getValue("unit") as string;
            return <Badge variant="outline">{unit}</Badge>;
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

function RowActions({ row }: { row: Row<BuilderWithRelations> }) {
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
                        <Link href={`/dashboard/builders/views/${row.original.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>Voir</span>
                            <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/builders/${row.original.id}`}>
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
