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
import type { Tank } from "@prisma/client";

// La fonction de filtre est mise à jour pour utiliser les champs du tank
const multiColumnFilterFn: FilterFn<Tank> = (row, columnId, filterValue) => {
    const searchableRowContent = `${row.original.name} ${row.original.depot?.name ?? ''} ${row.original.produit?.name ?? ''}`.toLowerCase();
    const searchTerm = (filterValue ?? "").toLowerCase();
    return searchableRowContent.includes(searchTerm);
};

// La définition des colonnes est mise à jour
export const columns: ColumnDef<Tank>[] = [
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
        header: "Nom",
        accessorKey: "name",
        cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
        size: 150,
        filterFn: multiColumnFilterFn,
        enableHiding: false,
    },
    {
        header: "Dépôt",
        accessorKey: "depot.name",
        cell: ({ row }) => <div>{row.original.depot?.name || "N/A"}</div>,
        size: 150,
    },
    {
        header: "Produit",
        accessorKey: "produit.name",
        cell: ({ row }) => <div>{row.original.produit?.name || "N/A"}</div>,
        size: 150,
    },
    {
        header: "Capacité",
        accessorKey: "capacity",
        cell: ({ row }) => <div>{row.getValue("capacity")}</div>,
        size: 100,
    },
    {
        header: "Niveau Actuel",
        accessorKey: "currentLevel",
        cell: ({ row }) => <div>{row.getValue("currentLevel")}</div>,
        size: 120,
    },
    {
        header: "Unité",
        accessorKey: "unit",
        cell: ({ row }) => <div>{row.getValue("unit")}</div>,
        size: 80,
    },
    {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => <RowActions row={row} />,
        size: 60,
        enableHiding: false,
    },
];

function RowActions({ row }: { row: Row<Tank> }) {
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
                        <Link href={`/dashboard/tank/views/${row.original.id}`}>
                            <span>Voir</span>
                            <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/tank/${row.original.id}`}>
                            <span>Modification</span>
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
            <RemoveDialog open={openRemoveDialog} setOpen={setOpenRemoveDialog} Id={row.original.id} nameClient={row.original.name} />
        </DropdownMenu>
    );
}
