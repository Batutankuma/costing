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
import { Badge } from "@/components/ui/badge";

export type BanqueWithRelations = {
    id: string;
    nom: string;
    numeroCompte: string;
    devise: "XOF" | "USD" | "EUR" | "CDF";
    swift?: string | null;
    nomGestionnaire?: string | null;
    mailGestionnaire?: string | null;
    contactGestionnaire?: string | null;
    createdAt: Date;
    updatedAt: Date;
};

const multiColumnFilterFn: FilterFn<BanqueWithRelations> = (row, columnId, filterValue) => {
    const searchableRowContent = `${row.original.nom} ${row.original.numeroCompte || ''} ${row.original.swift || ''} ${row.original.nomGestionnaire || ''} ${row.original.mailGestionnaire || ''}`.toLowerCase();
    const searchTerm = (filterValue ?? "").toLowerCase();
    return searchableRowContent.includes(searchTerm);
};

export const columns: ColumnDef<BanqueWithRelations>[] = [
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
        accessorKey: "nom",
        cell: ({ row }) => <div className="font-medium">{row.getValue("nom")}</div>,
        size: 180,
        filterFn: multiColumnFilterFn,
        enableHiding: false,
    },
    {
        header: "Numéro de Compte",
        accessorKey: "numeroCompte",
        cell: ({ row }) => <div>{row.original.numeroCompte}</div>,
        size: 180,
    },
    {
        header: "Devise",
        accessorKey: "devise",
        cell: ({ row }) => (
            <Badge variant="outline">{row.original.devise}</Badge>
        ),
        size: 100,
    },
    {
        header: "SWIFT",
        accessorKey: "swift",
        cell: ({ row }) => <div>{row.original.swift || "N/A"}</div>,
        size: 150,
    },
    {
        header: "Nom Gestionnaire",
        accessorKey: "nomGestionnaire",
        cell: ({ row }) => <div>{row.original.nomGestionnaire || "N/A"}</div>,
        size: 170,
    },
    {
        header: "Email Gestionnaire",
        accessorKey: "mailGestionnaire",
        cell: ({ row }) => <div>{row.original.mailGestionnaire || "N/A"}</div>,
        size: 180,
    },
    {
        header: "Contact Gestionnaire",
        accessorKey: "contactGestionnaire",
        cell: ({ row }) => <div>{row.original.contactGestionnaire || "N/A"}</div>,
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

function RowActions({ row }: { row: Row<BanqueWithRelations> }) {
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
                        <Link href={`/dashboard/banque/views/${row.original.id}`}>
                            <span>Voir</span>
                            <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/banque/${row.original.id}`}>
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
            <RemoveDialog open={openRemoveDialog} setOpen={setOpenRemoveDialog} Id={row.original.id} nameBanque={row.original.nom} />
        </DropdownMenu>
    );
}
