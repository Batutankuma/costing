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
type CommandeStatus = "DRAFT" | "CONFIRMED" | "PARTIALLY_RECEIVED" | "COMPLETED" | "CANCELLED";
type Commande = {
  id: string;
  reference: string;
  status: CommandeStatus;
  produitId: string;
  fournisseurId?: string | null;
  depotId?: string | null;
  quantite: number;
  unitPrice?: number | null;
  devise?: string | null;
  produit?: { name: string; unit?: string };
  fournisseur?: { nom: string };
  depot?: { name: string };
};
// useAction n'est plus nécessaire
import { Badge } from "@/components/ui/badge";

// Les imports d'actions ne sont plus nécessaires car les données sont déjà chargées

// La fonction de filtre est mise à jour pour utiliser les champs de Commande
const multiColumnFilterFn: FilterFn<Commande> = (row, columnId, filterValue) => {
    const searchableRowContent = `${row.original.reference} ${row.original.status ?? ''}`.toLowerCase();
    const searchTerm = (filterValue ?? "").toLowerCase();
    return searchableRowContent.includes(searchTerm);
};

// Composants optimisés qui utilisent les données déjà chargées
function ProduitName({ produitId, produitName }: { produitId: string; produitName?: string }) {
    return <div className="font-medium">{produitName || produitId}</div>;
}

function FournisseurName({ fournisseurId, fournisseurName }: { fournisseurId: string; fournisseurName?: string }) {
    return <div className="font-medium">{fournisseurName || fournisseurId}</div>;
}

function DepotName({ depotId, depotName }: { depotId: string; depotName?: string }) {
    return <div className="font-medium">{depotName || depotId}</div>;
}

// La définition des colonnes est mise à jour pour correspondre au modèle Commande
export const columns: ColumnDef<Commande>[] = [
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
        header: "Produit",
        accessorKey: "produitId",
        size: 150,
        cell: ({ row }) => {
            const produitId = row.getValue("produitId") as string;
            const produitName = (row.original as any).produit?.name;
            return <ProduitName produitId={produitId} produitName={produitName} />;
        },
    },
    {
        header: "Fournisseur",
        accessorKey: "fournisseurId",
        size: 150,
        cell: ({ row }) => {
            const fournisseurId = row.getValue("fournisseurId") as string;
            const fournisseurName = (row.original as any).fournisseur?.nom;
            return <FournisseurName fournisseurId={fournisseurId} fournisseurName={fournisseurName} />;
        },
    },
    {
        header: "Dépôt",
        accessorKey: "depotId",
        size: 150,
        cell: ({ row }) => {
            const depotId = row.getValue("depotId") as string;
            const depotName = (row.original as any).depot?.name;
            return <DepotName depotId={depotId} depotName={depotName} />;
        },
    },
    {
        header: "Quantités",
        accessorKey: "quantite",
        size: 180,
        cell: ({ row }) => {
            const quantity = row.getValue("quantite") as number;
            const unit = row.original.produit?.unit || "L";
            return <div className="font-semibold">{quantity} {unit}</div>;
        },
    },
    {
        header: "Prix unitaire",
        accessorKey: "unitPrice",
        size: 120,
        cell: ({ row }) => {
            const unitPrice = row.getValue("unitPrice") as number;
            const devise = row.original.devise;
            return <div className="font-medium">{unitPrice} {devise}</div>;
        },
    },
    {
        header: "Statut",
        accessorKey: "status",
        size: 140,
        cell: ({ row }) => {
            const status = row.getValue("status") as CommandeStatus;
            const getStatusColor = (status: CommandeStatus) => {
                switch (status) {
                    case "DRAFT": return "secondary";
                    case "CONFIRMED": return "default";
                    case "PARTIALLY_RECEIVED": return "outline";
                    case "COMPLETED": return "default";
                    case "CANCELLED": return "destructive";
                    default: return "outline";
                }
            };
            const getStatusText = (status: CommandeStatus) => {
                switch (status) {
                    case "DRAFT": return "Brouillon";
                    case "CONFIRMED": return "Confirmée";
                    case "PARTIALLY_RECEIVED": return "Partiellement reçue";
                    case "COMPLETED": return "Terminée";
                    case "CANCELLED": return "Annulée";
                    default: return status;
                }
            };
            return (
                <Badge variant={getStatusColor(status) as "secondary" | "default" | "destructive" | "outline"}>
                    {getStatusText(status)}
                </Badge>
            );
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

function RowActions({ row }: { row: Row<Commande> }) {
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
                        <Link href={`/dashboard/commande/views/${row.original.id}`} className="flex items-center justify-between w-full">
                            <span>Voir</span>
                            <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/commande/${row.original.id}`} className="flex items-center justify-between w-full">
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
            <RemoveDialog open={openRemoveDialog} setOpen={setOpenRemoveDialog} Id={row.original.id} nameClient={row.original.reference} />
        </DropdownMenu>
    );
}
