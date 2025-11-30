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

// Type pour Client avec relations Prisma
export type ClientWithRelations = {
    id: string;
    name: string;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    rccm?: string | null;
    idNat?: string | null;
    nif?: string | null;
    status: "ACTIVE" | "INACTIVE";
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
    owner?: {
        id: string;
        name: string;
    };
};

// La fonction de filtre utilise des champs disponibles avec relations
const multiColumnFilterFn: FilterFn<ClientWithRelations> = (row, columnId, filterValue) => {
    const searchableRowContent = `${row.original.name} ${row.original.company || ''} ${row.original.email || ''} ${row.original.phone || ''}`.toLowerCase();
    const searchTerm = (filterValue ?? "").toLowerCase();
    return searchableRowContent.includes(searchTerm);
};

// La définition des colonnes est mise à jour
export const columns: ColumnDef<ClientWithRelations>[] = [
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
        size: 180,
        filterFn: multiColumnFilterFn,
        enableHiding: false,
    },
    {
        header: "Société",
        accessorKey: "company",
        cell: ({ row }) => <div>{row.original.company || "N/A"}</div>,
        size: 150,
    },
    {
        header: "Email",
        accessorKey: "email",
        cell: ({ row }) => <div>{row.original.email || "N/A"}</div>,
        size: 180,
    },
    {
        header: "Téléphone",
        accessorKey: "phone",
        cell: ({ row }) => <div>{row.original.phone || "N/A"}</div>,
        size: 150,
    },
    {
        header: "Adresse",
        accessorKey: "address",
        cell: ({ row }) => <div className="max-w-[200px] truncate">{row.original.address || "N/A"}</div>,
        size: 200,
    },
    {
        header: "Statut",
        accessorKey: "status",
        size: 120,
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return (
                <Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
                    {status === "ACTIVE" ? "Actif" : "Inactif"}
                </Badge>
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

function RowActions({ row }: { row: Row<ClientWithRelations> }) {
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
                        <Link href={`/dashboard/clients/views/${row.original.id}`}>
                            <span>Voir</span>
                            <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/clients/${row.original.id}`}>
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
            <RemoveDialog open={openRemoveDialog} setOpen={setOpenRemoveDialog} Id={row.original.id} nameClient={row.original.name} />
        </DropdownMenu>
    );
}

