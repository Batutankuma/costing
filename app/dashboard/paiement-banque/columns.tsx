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

export type PaiementBanqueWithRelations = {
    id: string;
    commandeId: string;
    banqueId: string;
    statusPaiement: "EN_ATTENTE" | "PAYE" | "PARTIEL" | "ANNULE";
    datePaiement?: Date | null;
    montant?: number | null;
    createdAt: Date;
    updatedAt: Date;
    commande: {
        reference: string;
        id: string;
    };
    banque: {
        nom: string;
        id: string;
    };
};

const multiColumnFilterFn: FilterFn<PaiementBanqueWithRelations> = (row, columnId, filterValue) => {
    const searchableRowContent = `${row.original.commande?.reference || ''} ${row.original.banque?.nom || ''}`.toLowerCase();
    const searchTerm = (filterValue ?? "").toLowerCase();
    return searchableRowContent.includes(searchTerm);
};

export const columns: ColumnDef<PaiementBanqueWithRelations>[] = [
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
        header: "Commande",
        accessorKey: "commande.reference",
        cell: ({ row }) => <div className="font-medium">{row.original.commande?.reference || "N/A"}</div>,
        size: 150,
        filterFn: multiColumnFilterFn,
        enableHiding: false,
    },
    {
        header: "Banque",
        accessorKey: "banque.nom",
        cell: ({ row }) => <div>{row.original.banque?.nom || "N/A"}</div>,
        size: 180,
    },
    {
        header: "Status",
        accessorKey: "statusPaiement",
        cell: ({ row }) => {
            const status = row.getValue("statusPaiement") as string;
            const variant = status === "PAYE" ? "default" : status === "ANNULE" ? "destructive" : "secondary";
            const label = status === "PAYE" ? "Payé" : status === "PARTIEL" ? "Partiel" : status === "ANNULE" ? "Annulé" : "En attente";
            return <Badge variant={variant}>{label}</Badge>;
        },
        size: 120,
    },
    {
        header: "Date Paiement",
        accessorKey: "datePaiement",
        cell: ({ row }) => {
            const date = row.original.datePaiement;
            return <div>{date ? new Date(date).toLocaleDateString('fr-FR') : "N/A"}</div>;
        },
        size: 150,
    },
    {
        header: "Montant",
        accessorKey: "montant",
        cell: ({ row }) => {
            const montant = row.original.montant;
            return <div>{montant ? `${montant.toLocaleString('fr-FR')} $` : "N/A"}</div>;
        },
        size: 120,
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

function RowActions({ row }: { row: Row<PaiementBanqueWithRelations> }) {
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
                        <Link href={`/dashboard/paiement-banque/views/${row.original.id}`}>
                            <span>Voir</span>
                            <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/paiement-banque/${row.original.id}`}>
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
            <RemoveDialog open={openRemoveDialog} setOpen={setOpenRemoveDialog} Id={row.original.id} paiementRef={row.original.commande?.reference || row.original.id} />
        </DropdownMenu>
    );
}
