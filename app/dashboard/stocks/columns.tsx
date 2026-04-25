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
export type StockWithRelations = {
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
    // Autres champs possibles pour l'export ou autres composants
    margeUnitaire?: number | null;
    margeTotale?: number | null;
    deviseAchat?: string | null;
    deviseVente?: string | null;
    tauxChangeAchat?: string | null;
    tauxChangeVente?: string | null;
    prixVenteUnitaireConverti?: string | null;
    quantiteStockFinal?: string | null;
    pump?: string | null;
    valeurStockFinal?: string | null;
    fournisseur_nom?: string;
    client_nom?: string;
};

// La fonction de filtre utilise des champs disponibles avec relations
const multiColumnFilterFn: FilterFn<StockWithRelations> = (row, columnId, filterValue) => {
    const searchableRowContent = `${row.original.reference} ${row.original.produit?.nom || ''} ${row.original.depot?.name || ''}`.toLowerCase();
    const searchTerm = (filterValue ?? "").toLowerCase();
    return searchableRowContent.includes(searchTerm);
};

function isHospitalityMovement(reference: string) {
    return reference.startsWith("HOSP-");
}

function format2(value: number) {
    return Number(value).toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

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
        cell: ({ row }) => {
            const reference = row.getValue("reference") as string;
            const fromHospitality = isHospitalityMovement(reference);
            return (
                <div className="font-medium flex items-center gap-2">
                    <span className="text-xs truncate block max-w-[120px]">{reference}</span>
                    {fromHospitality ? (
                        <Badge variant="outline" className="text-xs">
                            Hospitality
                        </Badge>
                    ) : null}
                </div>
            );
        },
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
            return <div className="text-xs">{date.toLocaleDateString('fr-FR')}</div>;
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
        cell: ({ row }) => <div className="text-xs truncate max-w-[110px]">{row.original.produit?.nom || "N/A"}</div>,
        size: 150,
    },
    {
        header: "Dépôt",
        accessorKey: "depot.name",
        cell: ({ row }) => <div className="text-xs truncate max-w-[110px]">{row.original.depot?.name || "N/A"}</div>,
        size: 150,
    },
    {
        header: "Quantité",
        accessorKey: "quantite",
        size: 120,
        cell: ({ row }) => {
            const quantite = row.getValue("quantite") as number;
            const unite = row.original.unite;
            return <div className="font-medium text-xs">{format2(quantite)} {unite}</div>;
        },
    },
    {
        header: "Prix Unit. (CMP)",
        accessorKey: "prixUnitaireAchat",
        size: 120,
        cell: ({ row }) => {
            const prix = row.original.prixUnitaireAchat;
            return <div className="text-xs">{prix != null ? format2(prix) : "N/A"}</div>;
        },
    },
    {
        header: "Stock Final Qty",
        accessorKey: "stockQuantiteFinal",
        size: 120,
        cell: ({ row }) => {
            const qty = row.original.stockQuantiteFinal;
            return <div className="font-medium text-xs">{qty != null ? `${format2(qty)} ${row.original.unite}` : "N/A"}</div>;
        },
    },
    {
        header: "Stock Final PU",
        accessorKey: "stockPrixUnitaireFinal",
        size: 120,
        cell: ({ row }) => {
            const prix = row.original.stockPrixUnitaireFinal;
            return <div className="text-xs">{prix != null ? format2(prix) : "N/A"}</div>;
        },
    },
    {
        header: "Stock Final Valeur",
        accessorKey: "stockValeurFinal",
        size: 150,
        cell: ({ row }) => {
            const valeur = row.original.stockValeurFinal;
            return <div className="font-semibold text-xs">{valeur != null ? format2(valeur) : "N/A"}</div>;
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
