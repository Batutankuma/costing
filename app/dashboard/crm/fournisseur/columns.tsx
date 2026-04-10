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
type Fournisseur = {
    id: string;
    nom: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    adresse: string | null;
    rccm: string | null;
    idNat: string | null;
    nif: string | null;
    pays: string | null;
    notes: string | null;
    accountId: string | null;
    createdAt: Date;
    updatedAt: Date;
};

// La fonction de filtre est mise à jour pour utiliser tous les champs
const multiColumnFilterFn: FilterFn<Fournisseur> = (row, columnId, filterValue) => {
    const searchableRowContent = `${row.original.nom} ${row.original.company ?? ''} ${row.original.email ?? ''} ${row.original.phone ?? ''} ${row.original.adresse ?? ''} ${row.original.rccm ?? ''} ${row.original.idNat ?? ''} ${row.original.nif ?? ''} ${row.original.pays ?? ''} ${row.original.notes ?? ''}`.toLowerCase();
    const searchTerm = (filterValue ?? "").toLowerCase();
    return searchableRowContent.includes(searchTerm);
};

// La définition des colonnes est mise à jour
export const columns: ColumnDef<Fournisseur>[] = [
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
        header: "Société",
        accessorKey: "company",
        cell: ({ row }) => <div>{row.getValue("company") || "-"}</div>,
        size: 150,
    },
    {
        header: "Email",
        accessorKey: "email",
        cell: ({ row }) => <div>{row.getValue("email") || "-"}</div>,
        size: 200,
    },
    {
        header: "Téléphone",
        accessorKey: "phone",
        cell: ({ row }) => <div>{row.getValue("phone") || "-"}</div>,
        size: 150,
    },
    {
        header: "Adresse",
        accessorKey: "adresse",
        size: 220,
    },
    {
        header: "Pays",
        accessorKey: "pays",
        size: 150,
    },
    {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => <RowActions row={row} />,
        size: 60,
        enableHiding: false,
    },
];

function RowActions({ row }: { row: Row<Fournisseur> }) {
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
                        <Link href={`/dashboard/crm/fournisseur/views/${row.original.id}`}>
                            <span>Voir</span>
                            <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/crm/fournisseur/${row.original.id}`}>
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
            <RemoveDialog open={openRemoveDialog} setOpen={setOpenRemoveDialog} Id={row.original.id} nameClient={row.original.nom} />
        </DropdownMenu>
    );
}
