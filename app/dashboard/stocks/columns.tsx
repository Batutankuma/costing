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

// Type pour Stock avec relations Prisma
type StockWithRelations = {
    id: string;
    date: Date;
    reference: string;
    depotId?: string;
    type: 'ENTREE' | 'SORTIE';
    fournisseurId?: string;
    clientId?: string;
    produitId: string;
    quantite: number;
    prixUnitaireAchat?: number | null;
    prixUnitaireVente?: number | null;
    unite: string;
    devise: string;
    seuilMinimum: number;
    createdAt: Date;
    updatedAt: Date;
    depot?: {
        id: string;
        name: string;
    };
    produit?: {
        id: string;
        nom: string;
    };
    client?: {
        id: string;
        nom: string;
    };
    fournisseur?: {
        id: string;
        nom: string;
    };
    // Champs calculés CMP
    valeurEntree?: number | null;
    valeurSortie?: number | null;
    stockQuantiteFinal?: number | null;
    stockPrixUnitaireFinal?: number | null;
    stockValeurFinal?: number | null;
};

// La fonction de filtre utilise des champs disponibles avec relations
const multiColumnFilterFn: FilterFn<StockWithRelations> = (row, columnId, filterValue) => {
    const searchableRowContent = `${row.original.reference} ${row.original.produit?.nom || ''} ${row.original.depot?.name || ''}`.toLowerCase();
    const searchTerm = (filterValue ?? "").toLowerCase();
    return searchableRowContent.includes(searchTerm);
};

// La définition des colonnes est mise à jour
export const columns: ColumnDef<StockWithRelations>[] = [
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
        header: "Référence",
        accessorKey: "reference",
        cell: ({ row }) => <div className="font-medium">{row.getValue("reference")}</div>,
        size: 180,
        filterFn: multiColumnFilterFn,
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
        header: "Type",
        accessorKey: "type",
        size: 120,
        cell: ({ row }) => {
            const type = row.getValue("type") as string;
            return (
                <Badge variant={type === "ENTREE" ? "default" : "secondary"}>
                    {type === "ENTREE" ? "Entrée" : "Sortie"}
                </Badge>
            );
        },
    },
    {
        header: "Produit",
        accessorKey: "produit.nom",
        cell: ({ row }) => <div>{row.original.produit?.nom || "N/A"}</div>,
        size: 150,
    },
    {
        header: "Dépôt",
        accessorKey: "depot.name",
        cell: ({ row }) => <div>{row.original.depot?.name || "N/A"}</div>,
        size: 150,
    },
    {
        header: "Quantité",
        accessorKey: "quantite",
        size: 120,
        cell: ({ row }) => {
            const quantite = row.getValue("quantite") as number;
            const unite = row.original.unite;
            return <div className="font-medium">{quantite} {unite}</div>;
        },
    },
    {
        header: "Prix Unit. (CMP)",
        accessorKey: "prixUnitaireAchat",
        size: 120,
        cell: ({ row }) => {
            const prix = row.original.prixUnitaireAchat;
            return <div>{prix != null ? Number(prix).toFixed(4) : "N/A"}</div>;
        },
    },
    {
        header: "Stock Final Qty",
        accessorKey: "stockQuantiteFinal",
        size: 120,
        cell: ({ row }) => {
            const qty = row.original.stockQuantiteFinal;
            return <div className="font-medium">{qty != null ? `${qty} ${row.original.unite}` : "N/A"}</div>;
        },
    },
    {
        header: "Stock Final PU",
        accessorKey: "stockPrixUnitaireFinal",
        size: 120,
        cell: ({ row }) => {
            const prix = row.original.stockPrixUnitaireFinal;
            return <div>{prix != null ? Number(prix).toFixed(4) : "N/A"}</div>;
        },
    },
    {
        header: "Stock Final Valeur",
        accessorKey: "stockValeurFinal",
        size: 150,
        cell: ({ row }) => {
            const valeur = row.original.stockValeurFinal;
            return <div className="font-semibold">{valeur != null ? Number(valeur).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : "N/A"}</div>;
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

function RowActions({ row }: { row: Row<StockWithRelations> }) {
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
                        <Link href={`/dashboard/stocks/views/${row.original.id}`}>
                            <span>Voir</span>
                            <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/stocks/${row.original.id}`}>
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
            <RemoveDialog open={openRemoveDialog} setOpen={setOpenRemoveDialog} Id={row.original.id} nameClient={row.original.reference} />
        </DropdownMenu>
    );
}
