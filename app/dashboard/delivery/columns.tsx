'use client';

import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef, Row } from "@tanstack/react-table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Ellipsis } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import RemoveDialog from "./delete";
import { Badge } from "@/components/ui/badge";
import { Delivery } from "@/models/mvc";

// Type étendu pour inclure les relations chargées depuis Prisma
export type DeliveryWithRelations = Delivery & {
  client?: { id: string; nom?: string | null; name?: string | null; company?: string | null } | null;
  depot?: { id: string; name: string } | null;
  produit?: { id: string; name: string; nom?: string } | null;
  tank?: { id: string; name: string } | null;
};

// Fonction utilitaire pour obtenir le nom du client
function getClientName(client: DeliveryWithRelations['client']): string {
  if (!client) return "-";
  return client.nom || client.name || client.company || "-";
}

// Fonction utilitaire pour obtenir le nom du produit
function getProduitName(produit: DeliveryWithRelations['produit']): string {
  if (!produit) return "-";
  return produit.nom || produit.name || "-";
}

// Fonction pour obtenir la couleur du badge de paiement
function getPaiementColor(paiement: string) {
  switch (paiement) {
    case "DIRECT":
      return "bg-green-100 text-green-800";
    case "CREDIT":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Fonction pour obtenir le texte du paiement
function getPaiementText(paiement: string) {
  switch (paiement) {
    case "DIRECT":
      return "Direct";
    case "CREDIT":
      return "Crédit";
    default:
      return paiement;
  }
}

// La définition des colonnes est mise à jour
export const columns: ColumnDef<DeliveryWithRelations>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
            const reference = row.getValue("reference") as string | null;
            return <div className="font-medium">{reference || "-"}</div>;
        },
        size: 120,
    },
    {
        header: "Date",
        accessorKey: "deliveryDate",
        cell: ({ row }) => {
            const date = row.getValue("deliveryDate") as string | Date;
            return <span>{date ? new Date(date).toLocaleDateString('fr-FR') : "-"}</span>;
        },
        size: 100,
    },
    {
        header: "Client",
        accessorKey: "clientId",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            return <span>{getClientName(original.client)}</span>;
        },
        size: 120,
    },
    {
        header: "Dépôt",
        accessorKey: "depotId",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            return <span>{original.depot?.name || "-"}</span>;
        },
        size: 120,
    },
    {
        header: "Produit",
        accessorKey: "produitId",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            return <span>{getProduitName(original.produit)}</span>;
        },
        size: 120,
    },
    {
        header: "Tank",
        accessorKey: "tankId",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            return <span>{original.tank?.name || "-"}</span>;
        },
        size: 100,
    },
    {
        header: "Quantité",
        accessorKey: "quantity",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            const quantity = original.quantity || 0;
            const unit = original.unit || "";
            return <span>{quantity.toFixed(2)} {unit}</span>;
        },
        size: 100,
    },
    {
        header: "Compteurs",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            const openingEter = original.openingEter || 0;
            const closingEter = original.closingEter || 0;
            const difference = closingEter - openingEter;
            return (
                <div className="text-xs">
                    <div>Ouv: {openingEter}</div>
                    <div>Ferm: {closingEter}</div>
                    <div className="font-medium text-blue-600">Diff: {difference}</div>
                </div>
            );
        },
        size: 100,
    },
    {
        header: "Prix unitaire",
        accessorKey: "prixUnitaire",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            const prix = original.prixUnitaire || 0;
            return <span>{prix ? `${prix.toFixed(2)} USD` : "-"}</span>;
        },
        size: 120,
    },
    {
        header: "Paiement",
        accessorKey: "paiement",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            const paiement = original.paiement || "CREDIT";
            return (
                <Badge className={getPaiementColor(paiement)}>
                    {getPaiementText(paiement)}
                </Badge>
            );
        },
        size: 100,
    },
    {
        header: "Type avion",
        accessorKey: "typeAircraft",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            const typeAircraft = original.typeAircraft || "-";
            return <span>{typeAircraft}</span>;
        },
        size: 120,
    },
    {
        header: "Vol",
        accessorKey: "flightNumber",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            const flightNumber = original.flightNumber || "-";
            return <span>{flightNumber}</span>;
        },
        size: 100,
    },
    {
        header: "Note",
        accessorKey: "note",
        cell: ({ row }) => {
            const note = row.getValue("note") as string | null;
            return <div className="max-w-xs truncate" title={note || undefined}>{note || "-"}</div>;
        },
        size: 150,
        filterFn: (row, columnId, filterValue) => {
            const searchableRowContent = `${row.original.note} ${row.original.reference} ${row.original.typeAircraft ?? ''} ${row.original.flightNumber ?? ''}`.toLowerCase();
            const searchTerm = (filterValue ?? "").toLowerCase();
            return searchableRowContent.includes(searchTerm);
        },
        enableHiding: true,
    },
    // Colonne Document retirée: champ non présent dans le schéma actuel
    {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => <RowActions row={row} />,
        size: 60,
        enableHiding: false,
    },
];

function RowActions({ row }: { row: Row<DeliveryWithRelations> }) {
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
                        <Link href={`/dashboard/delivery/views/${row.original.id}`}>
                            Voir
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/delivery/${row.original.id}`}>
                            Modifier
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:text-destructive"
                    onClick={() => setOpenRemoveDialog(true)}
                >
                    Supprimer
                </DropdownMenuItem>
            </DropdownMenuContent>
            <RemoveDialog open={openRemoveDialog} setOpen={setOpenRemoveDialog} Id={row.original.id} nameClient={row.original.note ?? ""} />
        </DropdownMenu>
    );
}
