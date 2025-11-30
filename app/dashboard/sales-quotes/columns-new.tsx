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

export type SalesQuote = {
    id: string;
    createdAt: string | Date;
    proformaNumber?: string | null;
    user?: { name?: string | null } | null;
    totalDDUUSD?: number | null;
    totalDDPUSD?: number | null;
    client?: { name?: string | null } | null;
};

// La fonction de filtre utilise des champs disponibles
const multiColumnFilterFn: FilterFn<SalesQuote> = (row, columnId, filterValue) => {
    const searchableRowContent = `${row.original.proformaNumber || ''} ${row.original.client?.name || ''} ${row.original.user?.name || ''}`.toLowerCase();
    const searchTerm = (filterValue ?? "").toLowerCase();
    return searchableRowContent.includes(searchTerm);
};

// La définition des colonnes
export const columns: ColumnDef<SalesQuote>[] = [
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
        accessorKey: "createdAt",
        size: 150,
        cell: ({ row }) => {
            const date = row.original.createdAt ? new Date(row.original.createdAt) : null;
            return <div>{date ? date.toLocaleDateString("fr-FR") : "—"}</div>;
        },
    },
    {
        header: "N° Proforma",
        accessorKey: "proformaNumber",
        cell: ({ row }) => <div className="font-medium">{row.original.proformaNumber || "—"}</div>,
        size: 180,
        filterFn: multiColumnFilterFn,
        enableHiding: false,
    },
    {
        header: "Client",
        accessorKey: "client.name",
        cell: ({ row }) => <div>{row.original.client?.name || "—"}</div>,
        size: 180,
    },
    {
        header: "Auteur",
        accessorKey: "user.name",
        cell: ({ row }) => <div>{row.original.user?.name || "—"}</div>,
        size: 150,
    },
    {
        header: "DDU (USD)",
        accessorKey: "totalDDUUSD",
        size: 150,
        cell: ({ row }) => {
            const amount = row.original.totalDDUUSD || 0;
            return (
                <div className="font-semibold text-right">
                    ${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            );
        },
    },
    {
        header: "DDP (USD)",
        accessorKey: "totalDDPUSD",
        size: 150,
        cell: ({ row }) => {
            const amount = row.original.totalDDPUSD || 0;
            return (
                <div className="font-semibold text-right">
                    ${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            );
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

function RowActions({ row }: { row: Row<SalesQuote> }) {
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
                        <Link href={`/dashboard/sales-quotes/views/${row.original.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>Voir</span>
                            <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/sales-quotes/${row.original.id}`}>
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
            <RemoveDialog open={openRemoveDialog} setOpen={setOpenRemoveDialog} Id={row.original.id} nameClient={row.original.proformaNumber || row.original.id} />
        </DropdownMenu>
    );
}

