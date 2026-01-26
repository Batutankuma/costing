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

// Type pour Shipment avec relations Prisma
export type ShipmentWithRelations = {
    id: string;
    numerobl: string;
    date: Date;
    quantite: number;
    unite: string;
    prixUnitaire: number | null;
    description: string | null;
    clientId: string | null;
    produitId: string;
    depotId: string | null;
    createdAt: Date;
    updatedAt: Date;
    client?: {
        id: string;
        name: string;
        company: string | null;
    } | null;
    produit?: {
        id: string;
        name: string;
        unit: string;
    } | null;
    depot?: {
        id: string;
        name: string;
    } | null;
};

// Fonction de filtre multi-colonnes
const multiColumnFilterFn: FilterFn<ShipmentWithRelations> = (row, columnId, filterValue) => {
    const clientName = row.original.client?.name || row.original.client?.company || '';
    const produitName = row.original.produit?.name || '';
    const depotName = row.original.depot?.name || '';
    const numerobl = row.original.numerobl || '';
    const description = row.original.description || '';
    
    const searchableRowContent = `${numerobl} ${clientName} ${produitName} ${depotName} ${description}`.toLowerCase();
    const searchTerm = (filterValue ?? "").toLowerCase();
    return searchableRowContent.includes(searchTerm);
};

// Helper pour obtenir le nom du client
const getClientName = (shipment: ShipmentWithRelations): string => {
    if (shipment.client?.name) return shipment.client.name;
    if (shipment.client?.company) return shipment.client.company;
    return "N/A";
};

// Helper pour obtenir le nom du produit
const getProduitName = (shipment: ShipmentWithRelations): string => {
    return shipment.produit?.name || "N/A";
};

// Helper pour obtenir le nom du dépôt
const getDepotName = (shipment: ShipmentWithRelations): string => {
    return shipment.depot?.name || "N/A";
};

export const columns: ColumnDef<ShipmentWithRelations>[] = [
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
        header: "Numéro BL",
        accessorKey: "numerobl",
        cell: ({ row }) => <div className="font-medium">{row.getValue("numerobl")}</div>,
        size: 150,
        filterFn: multiColumnFilterFn,
        enableHiding: false,
    },
    {
        header: "Date",
        accessorKey: "date",
        size: 120,
        cell: ({ row }) => {
            const date = row.getValue("date") as Date;
            return <div>{new Date(date).toLocaleDateString('fr-FR')}</div>;
        },
    },
    {
        header: "Client",
        accessorKey: "client",
        size: 180,
        cell: ({ row }) => <div>{getClientName(row.original)}</div>,
    },
    {
        header: "Produit",
        accessorKey: "produit",
        size: 180,
        cell: ({ row }) => <div>{getProduitName(row.original)}</div>,
    },
    {
        header: "Dépôt",
        accessorKey: "depot",
        size: 150,
        cell: ({ row }) => <div>{getDepotName(row.original)}</div>,
    },
    {
        header: "Quantité",
        accessorKey: "quantite",
        size: 120,
        cell: ({ row }) => {
            const quantite = row.getValue("quantite") as number;
            const unite = row.original.unite;
            return <div>{quantite.toFixed(2)} {unite}</div>;
        },
    },
    {
        header: "Prix Unitaire",
        accessorKey: "prixUnitaire",
        size: 130,
        cell: ({ row }) => {
            const prix = row.getValue("prixUnitaire") as number | null;
            return <div>{prix ? prix.toFixed(2) : "N/A"}</div>;
        },
    },
    {
        header: "Total",
        id: "total",
        size: 130,
        cell: ({ row }) => {
            const quantite = row.original.quantite;
            const prixUnitaire = row.original.prixUnitaire;
            const total = prixUnitaire ? (quantite * prixUnitaire).toFixed(2) : "N/A";
            return <div className="font-semibold">{total}</div>;
        },
    },
    {
        header: "Description",
        accessorKey: "description",
        size: 200,
        cell: ({ row }) => {
            const description = row.getValue("description") as string | null;
            return <div className="max-w-[200px] truncate">{description || "N/A"}</div>;
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

function RowActions({ row }: { row: Row<ShipmentWithRelations> }) {
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
                        <Link href={`/dashboard/shipments/views/${row.original.id}`}>
                            <span>Voir</span>
                            <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/shipments/${row.original.id}`}>
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
            <RemoveDialog 
                open={openRemoveDialog} 
                setOpen={setOpenRemoveDialog} 
                Id={row.original.id} 
                numerobl={row.original.numerobl} 
            />
        </DropdownMenu>
    );
}

