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
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import RemoveDialog from "./delete";

// Type pour Prospect avec relations Prisma
export type ProspectWithRelations = {
    id: string;
    name: string;
    company?: string | null;
    email?: string | null;
    phone?: string | null;
    source?: string | null;
    stage: "NEW" | "CONTACTED" | "QUALIFIED" | "WON" | "LOST";
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
    owner?: {
        id: string;
        name: string;
    } | null;
    // Champs de qualification
    jobTitle?: string | null;
    website?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string | null;
    potentialValue?: number | null;
    expectedCloseDate?: Date | null;
    tags?: string[];
};

const stageVariantByStage: Record<ProspectWithRelations["stage"], "default" | "secondary" | "destructive" | "outline"> = {
    NEW: "default",
    CONTACTED: "outline",
    QUALIFIED: "secondary",
    WON: "default",
    LOST: "destructive",
};

export const stageLabels = {
    NEW: "Nouveau",
    CONTACTED: "Contacté",
    QUALIFIED: "Qualifié",
    WON: "Gagné",
    LOST: "Perdu"
};

// La fonction de filtre utilise des champs disponibles avec relations
const multiColumnFilterFn: FilterFn<ProspectWithRelations> = (row, columnId, filterValue) => {
    const searchableRowContent = `${row.original.name} ${row.original.company || ''} ${row.original.email || ''} ${row.original.phone || ''} ${row.original.source || ''} ${row.original.jobTitle || ''} ${row.original.city || ''} ${row.original.country || ''} ${row.original.owner?.name || ''} ${row.original.tags?.join(' ') || ''}`.toLowerCase();
    const searchTerm = (filterValue ?? "").toLowerCase();
    return searchableRowContent.includes(searchTerm);
};

// La définition des colonnes est mise à jour
export const columns: ColumnDef<ProspectWithRelations>[] = [
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
        header: "Source",
        accessorKey: "source",
        cell: ({ row }) => <div>{row.original.source || "N/A"}</div>,
        size: 150,
    },
    {
        header: "Étape",
        accessorKey: "stage",
        size: 120,
        cell: ({ row }) => {
            const stage = row.getValue("stage") as string;
            return (
                <Badge variant={stageVariantByStage[stage as keyof typeof stageVariantByStage]}>
                    {stageLabels[stage as keyof typeof stageLabels]}
                </Badge>
            );
        },
    },
    {
        header: "Propriétaire",
        accessorKey: "owner",
        size: 150,
        cell: ({ row }) => {
            const owner = row.original.owner;
            return <div>{owner?.name || "Non assigné"}</div>;
        },
    },
    {
        header: "Valeur potentielle",
        accessorKey: "potentialValue",
        size: 150,
        cell: ({ row }) => {
            const value = row.original.potentialValue;
            return <div>{value ? `${value.toLocaleString('fr-FR')} USD` : "N/A"}</div>;
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

function RowActions({ row }: { row: Row<ProspectWithRelations> }) {
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
                        <Link href={`/dashboard/prospects/views/${row.original.id}`}>
                            <span>Voir</span>
                            <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/prospects/${row.original.id}`}>
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
