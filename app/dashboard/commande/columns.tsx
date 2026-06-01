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
export type Commande = {
  id: string;
  reference: string;
  date?: Date | string;
  status: CommandeStatus;
  produitId: string;
  fournisseurId?: string | null;
  depotId?: string | null;
  quantite: number;
  unitPrice?: number | null;
  devise?: string | null;
  tva?: number | null;
  numeroFacture?: string | null;
  typeFacture?: string | null;
  dateFacture?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  produit?: { name: string; unit?: string } | null;
  fournisseur?: { nom: string } | null;
  depot?: { name: string } | null;
  receptions?: Array<{ quantity: number }>;
  hospitalityRows?: Array<{ offlQty20: number }>;
  currentQuantity?: number;
  unit?: string;
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

function formatCommandeDecimal(value: number) {
    return Number(value || 0).toLocaleString("fr-FR", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 4,
    });
}

const COMMANDE_STATUS_LABELS: Record<CommandeStatus, string> = {
    DRAFT: "Brouillon",
    CONFIRMED: "Confirmée",
    PARTIALLY_RECEIVED: "Partiellement reçue",
    COMPLETED: "Terminée",
    CANCELLED: "Annulée",
};

function formatCommandeDate(value?: Date | string | null) {
    if (!value) return "";
    const d = value instanceof Date ? value : new Date(value);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("fr-FR");
}

/** Ligne d'export CSV/Excel sans IDs — libellés lisibles */
export function mapCommandeForExport(row: Commande) {
    const unit = row.produit?.unit || "L";
    const qty = (n: number) => `${formatCommandeDecimal(n)} ${unit}`.trim();
    return {
        Référence: row.reference,
        Date: formatCommandeDate(row.date),
        Statut: COMMANDE_STATUS_LABELS[row.status] ?? row.status,
        Produit: row.produit?.name ?? "",
        Fournisseur: row.fournisseur?.nom ?? "",
        Dépôt: row.depot?.name ?? "",
        "Qté commandée": qty(getInvoiceOrderedQuantity(row)),
        "Qté réceptionnée": qty(getReceivedQuantity(row)),
        "Qté hospitality": qty(getHospitalityQuantity(row)),
        Restant: qty(getOperationalRemainingQuantity(row)),
        "Prix unitaire": row.unitPrice ?? "",
        Devise: row.devise ?? "",
        "N° facture": row.numeroFacture ?? "",
        "Type facture": row.typeFacture ?? "",
        "Date facture": formatCommandeDate(row.dateFacture),
        "TVA (%)": row.tva ?? "",
        "Créé le": formatCommandeDate(row.createdAt),
        "Modifié le": formatCommandeDate(row.updatedAt),
    };
}

function getReceivedQuantity(commande: Commande) {
    return commande.receptions?.reduce((sum, reception) => sum + (reception.quantity || 0), 0) || 0;
}

function getHospitalityQuantity(commande: Commande) {
    return commande.hospitalityRows?.reduce((sum, row) => sum + (row.offlQty20 || 0), 0) || 0;
}

function getInvoiceOrderedQuantity(commande: Commande) {
    // Quantité facture statique = quantité actuelle + consommations hospitality déjà déduites.
    return Number(commande.quantite || 0) + getHospitalityQuantity(commande);
}

function getOperationalRemainingQuantity(commande: Commande) {
    // quantite est déjà diminuée par Hospitality dans le module hospitality/actions.ts
    // Le restant opérationnel doit donc soustraire uniquement les réceptions.
    const currentCommandeQty = Number(commande.quantite || 0);
    const receptionsQty = getReceivedQuantity(commande);
    return Math.max(0, currentCommandeQty - receptionsQty);
}

// Composants optimisés qui utilisent les données déjà chargées
function ProduitName({ produitId, produitName }: { produitId: string; produitName?: string }) {
    return <div className="font-medium text-xs truncate max-w-[130px]">{produitName || produitId}</div>;
}

function FournisseurName({ fournisseurId, fournisseurName }: { fournisseurId: string; fournisseurName?: string }) {
    return <div className="font-medium text-xs truncate max-w-[130px]">{fournisseurName || fournisseurId}</div>;
}

function DepotName({ depotId, depotName }: { depotId: string; depotName?: string }) {
    return <div className="font-medium text-xs truncate max-w-[120px]">{depotName || depotId}</div>;
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
        cell: ({ row }) => <div className="font-medium text-xs truncate max-w-[150px]">{row.getValue("reference")}</div>,
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
            const produitName = row.original.produit?.name;
            return <ProduitName produitId={produitId} produitName={produitName} />;
        },
    },
    {
        header: "Fournisseur",
        accessorKey: "fournisseurId",
        size: 150,
        cell: ({ row }) => {
            const fournisseurId = row.getValue("fournisseurId") as string;
            const fournisseurName = row.original.fournisseur?.nom;
            return <FournisseurName fournisseurId={fournisseurId} fournisseurName={fournisseurName} />;
        },
    },
    {
        header: "Dépôt",
        accessorKey: "depotId",
        size: 150,
        cell: ({ row }) => {
            const depotId = row.getValue("depotId") as string;
            const depotName = row.original.depot?.name;
            return <DepotName depotId={depotId} depotName={depotName} />;
        },
    },
    {
        header: "Qté commandée",
        accessorKey: "quantite",
        size: 140,
        cell: ({ row }) => {
            const orderedQuantity = getInvoiceOrderedQuantity(row.original);
            const unit = row.original.produit?.unit || "L";
            return <div className="font-semibold text-xs">{formatCommandeDecimal(orderedQuantity)} {unit}</div>;
        },
    },
    {
        header: "Qté réceptionnée",
        id: "receivedQuantity",
        size: 140,
        cell: ({ row }) => {
            const receivedQuantity = getReceivedQuantity(row.original);
            const unit = row.original.produit?.unit || "L";
            return <div className="font-semibold text-xs">{formatCommandeDecimal(receivedQuantity)} {unit}</div>;
        },
    },
    {
        header: "Qté hospitality",
        id: "hospitalityQuantity",
        size: 130,
        cell: ({ row }) => {
            const hospitalityQty = getHospitalityQuantity(row.original);
            const unit = row.original.produit?.unit || "L";
            return <div className="font-semibold text-xs">{formatCommandeDecimal(hospitalityQty)} {unit}</div>;
        },
    },
    {
        header: "Restant",
        id: "remainingQuantity",
        size: 120,
        cell: ({ row }) => {
            const remainingQuantity = getOperationalRemainingQuantity(row.original);
            const unit = row.original.produit?.unit || "L";
            return <div className="font-semibold text-xs">{formatCommandeDecimal(remainingQuantity)} {unit}</div>;
        },
    },
    {
        header: "Prix unitaire",
        accessorKey: "unitPrice",
        size: 120,
        cell: ({ row }) => {
            const unitPrice = (row.getValue("unitPrice") as number) || 0;
            const devise = row.original.devise;
            return <div className="font-medium text-xs">{formatCommandeDecimal(unitPrice)} {devise ?? ""}</div>;
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
