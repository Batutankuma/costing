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

export type LicenceWithRelations = {
    id: string;
    commandeId: string;
    banqueId: string;
    validiteLicence: "VALIDE" | "EXPIREE" | "EN_ATTENTE" | "SUSPENDUE";
    numeroBulletin?: string | null;
    numeroLicenceImport?: string | null;
    numeroLettreEngagement?: string | null;
    statusJustification: boolean;
    dateJustification?: Date | string | null;
    description?: string | null;
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

const multiColumnFilterFn: FilterFn<LicenceWithRelations> = (row, columnId, filterValue) => {
    const searchableRowContent = `${row.original.commande?.reference || ''} ${row.original.banque?.nom || ''} ${row.original.numeroBulletin || ''} ${row.original.numeroLicenceImport || ''} ${row.original.description || ''}`.toLowerCase();
    const searchTerm = (filterValue ?? "").toLowerCase();
    return searchableRowContent.includes(searchTerm);
};

export const columns: ColumnDef<LicenceWithRelations>[] = [
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
        header: "Validité",
        accessorKey: "validiteLicence",
        cell: ({ row }) => {
            const validite = row.getValue("validiteLicence") as string;
            const variant = validite === "VALIDE" ? "default" : validite === "EXPIREE" ? "destructive" : "secondary";
            const label = validite === "VALIDE" ? "Valide" : validite === "EXPIREE" ? "Expirée" : validite === "EN_ATTENTE" ? "En attente" : "Suspendue";
            return <Badge variant={variant}>{label}</Badge>;
        },
        size: 120,
    },
    {
        header: "N° Bulletin",
        accessorKey: "numeroBulletin",
        cell: ({ row }) => <div>{row.original.numeroBulletin || "N/A"}</div>,
        size: 150,
    },
    {
        header: "N° Licence Import",
        accessorKey: "numeroLicenceImport",
        cell: ({ row }) => <div>{row.original.numeroLicenceImport || "N/A"}</div>,
        size: 150,
    },
    {
        header: "N° Lettre Engagement",
        accessorKey: "numeroLettreEngagement",
        cell: ({ row }) => <div>{row.original.numeroLettreEngagement || "N/A"}</div>,
        size: 180,
    },
    {
        header: "Justification",
        accessorKey: "statusJustification",
        cell: ({ row }) => (
            <Badge variant={row.original.statusJustification ? "default" : "secondary"}>
                {row.original.statusJustification ? "Oui" : "Non"}
            </Badge>
        ),
        size: 120,
    },
    {
        header: "Description",
        accessorKey: "description",
        cell: ({ row }) => {
            const text = row.original.description;
            if (!text) return <div className="text-muted-foreground">—</div>;
            const preview = text.length > 60 ? `${text.slice(0, 60)}…` : text;
            return <div className="text-xs max-w-[200px] truncate" title={text}>{preview}</div>;
        },
        size: 200,
    },
    {
        header: "Date justification",
        accessorKey: "dateJustification",
        cell: ({ row }) => {
            const date = row.original.dateJustification;
            if (!date) return <div className="text-muted-foreground">—</div>;
            return (
                <div>
                    {new Date(date).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                    })}
                </div>
            );
        },
        size: 140,
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

function RowActions({ row }: { row: Row<LicenceWithRelations> }) {
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
                        <Link href={`/dashboard/licence/views/${row.original.id}`}>
                            <span>Voir</span>
                            <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/licence/${row.original.id}`}>
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
            <RemoveDialog open={openRemoveDialog} setOpen={setOpenRemoveDialog} Id={row.original.id} licenceId={row.original.numeroLicenceImport || row.original.id} />
        </DropdownMenu>
    );
}
