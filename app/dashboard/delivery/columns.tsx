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
import { usePathname } from "next/navigation";

// Type étendu pour inclure les relations chargées depuis Prisma
export type DeliveryWithRelations = Delivery & {
  client?: { id: string; nom?: string | null; name?: string | null; company?: string | null } | null;
  destinationClient?: { id: string; nom?: string | null; name?: string | null; company?: string | null } | null;
  transporter?: { id: string; nom?: string | null } | null;
  depot?: { id: string; name: string } | null;
  produit?: { id: string; name: string; nom?: string } | null;
  equipment?: { id: string; name: string } | null;
  saleUnitPrice?: number;
  purchaseUnitPrice?: number;
  saleTotal?: number;
  purchaseTotal?: number;
  profit?: number;
  profitMargin?: number;
};

// Fonction utilitaire pour obtenir le nom du client
function getClientName(client: DeliveryWithRelations['client']): string {
  if (!client) return "-";
  return client.nom || client.name || client.company || "-";
}

function getTransporterName(transporter: DeliveryWithRelations["transporter"]): string {
  return transporter?.nom || "-";
}

// Fonction utilitaire pour obtenir le nom du produit
function getProduitName(produit: DeliveryWithRelations['produit']): string {
  if (!produit) return "-";
  return produit.nom || produit.name || "-";
}

function format2(value: number) {
  return Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
        header: "Num Commande",
        accessorKey: "commandNumber",
        cell: ({ row }) => {
            const commandNumber = row.getValue("commandNumber") as string | null;
            return <div className="font-medium text-xs truncate max-w-[120px]">{commandNumber || "-"}</div>;
        },
        size: 120,
    },
    {
        header: "Date",
        accessorKey: "deliveryDate",
        cell: ({ row }) => {
            const date = row.getValue("deliveryDate") as string | Date;
            return <span className="text-xs">{date ? new Date(date).toLocaleDateString('fr-FR') : "-"}</span>;
        },
        size: 100,
    },
    {
        header: "Client",
        accessorKey: "clientId",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            return <span className="text-xs truncate block max-w-[120px]">{getClientName(original.client)}</span>;
        },
        size: 120,
    },
    {
        header: "Dépôt",
        accessorKey: "depotId",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            return <span className="text-xs truncate block max-w-[120px]">{original.depot?.name || "-"}</span>;
        },
        size: 120,
    },
    {
        header: "Transporter",
        accessorKey: "transporterId",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            return <span className="text-xs truncate block max-w-[120px]">{getTransporterName(original.transporter)}</span>;
        },
        size: 120,
    },
    {
        header: "Destination",
        accessorKey: "destinationClientId",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            return <span className="text-xs truncate block max-w-[120px]">{getClientName(original.destinationClient)}</span>;
        },
        size: 120,
    },
    {
        header: "Q Loaded",
        accessorKey: "qLoaded",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            return <span className="text-xs">{format2(original.qLoaded || 0)}</span>;
        },
        size: 100,
    },
    {
        header: "Q @20",
        accessorKey: "q20",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            return <span className="text-xs">{format2(original.q20 || 0)}</span>;
        },
        size: 100,
    },
    {
        header: "Q Offloaded",
        accessorKey: "qOffloaded",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            return <span className="text-xs">{format2(original.qOffloaded || 0)}</span>;
        },
        size: 100,
    },
    {
        header: "Variance",
        accessorKey: "varianceQty20",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            return <span className="text-xs">{format2(original.varianceQty20 || 0)}</span>;
        },
        size: 100,
    },
    {
        header: "Transit Loss",
        accessorKey: "transitAllowableLoss",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            return <span className="text-xs">{format2(original.transitAllowableLoss || 0)}</span>;
        },
        size: 120,
    },
    {
        header: "Dis Loss",
        accessorKey: "disAllowableLoss",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            return <span className="text-xs">{format2(original.disAllowableLoss || 0)}</span>;
        },
        size: 100,
    },
    {
        header: "Rate ($)",
        accessorKey: "rate",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            return <span className="text-xs">{format2(original.rate || 0)}</span>;
        },
        size: 120,
    },
    {
        header: "Total ($)",
        accessorKey: "total",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            return <span className="text-xs font-semibold">{format2(original.total || 0)}</span>;
        },
        size: 100,
    },
    {
        header: "Prix achat",
        accessorKey: "purchaseUnitPrice",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            return <span className="text-xs">{format2(original.purchaseUnitPrice || 0)}</span>;
        },
        size: 110,
    },
    {
        header: "Prix vente",
        accessorKey: "saleUnitPrice",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            return <span className="text-xs">{format2(original.saleUnitPrice || 0)}</span>;
        },
        size: 110,
    },
    {
        header: "Cout total",
        accessorKey: "purchaseTotal",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            return <span className="text-xs">{format2(original.purchaseTotal || 0)}</span>;
        },
        size: 120,
    },
    {
        header: "Vente totale",
        accessorKey: "saleTotal",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            return <span className="text-xs">{format2(original.saleTotal || 0)}</span>;
        },
        size: 120,
    },
    {
        header: "Benefice",
        accessorKey: "profit",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            const profit = Number(original.profit || 0);
            return <span className={`text-xs font-semibold ${profit >= 0 ? "text-emerald-700" : "text-red-600"}`}>{format2(profit)}</span>;
        },
        size: 110,
    },
    {
        header: "Marge %",
        accessorKey: "profitMargin",
        cell: ({ row }) => {
            const original = row.original as DeliveryWithRelations;
            return <span className="text-xs">{format2(original.profitMargin || 0)}%</span>;
        },
        size: 100,
    },
    {
        header: "Note",
        accessorKey: "note",
        cell: ({ row }) => {
            const note = row.getValue("note") as string | null;
            return <div className="text-xs max-w-[150px] truncate" title={note || undefined}>{note || "-"}</div>;
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
    const pathname = usePathname();
    const basePath = pathname.startsWith("/dashboard/delivery-lbb")
      ? "/dashboard/delivery-lbb"
      : "/dashboard/delivery";
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
                        <Link href={`${basePath}/views/${row.original.id}`}>
                            Voir
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`${basePath}/${row.original.id}`}>
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
