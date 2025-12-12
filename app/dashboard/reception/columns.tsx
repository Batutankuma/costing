'use client';

import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef, FilterFn, Row } from "@tanstack/react-table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Ellipsis, Edit, Eye, Scale, Calendar } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import DeleteReception from "./delete";
import { Reception } from "@/models/mvc";
import { useAction } from "next-safe-action/hooks";
import { Badge } from "@/components/ui/badge";

// Import des actions pour récupérer les données
import { findAllAction as findAllCommandes } from "@/app/dashboard/commande/actions";
import { listProducts } from "@/app/dashboard/products/actions";
import { findAllAction as findAllTanks } from "@/app/dashboard/tank/actions";

// La fonction de filtre pour la recherche
const multiColumnFilterFn: FilterFn<Reception> = (row, columnId, filterValue) => {
    const searchableRowContent = `${row.original.reference || ''}`.toLowerCase();
    const searchTerm = (filterValue ?? "").toLowerCase();
    return searchableRowContent.includes(searchTerm);
};

// Composant pour afficher les informations de la commande
function CommandeInfo({ commandeId }: { commandeId: string }) {
    const [commandeInfo, setCommandeInfo] = useState<{ reference: string; quantite: number; } | null>(null);
    const { executeAsync: executeCommandes } = useAction(findAllCommandes);

    useEffect(() => {
        const loadCommande = async () => {
            try {
                const result = await executeCommandes();
                if (result?.data?.success && result.data.result) {
                    type CommandeRef = { id: string; reference: string; quantite: number };
                    const commande = (result.data.result as CommandeRef[]).find((c) => c.id === commandeId);
                    if (commande) {
                        setCommandeInfo({
                            reference: commande.reference,
                            quantite: commande.quantite,
                        });
                    }
                }
            } catch (error) {
                console.error("Erreur lors du chargement de la commande:", error);
            }
        };

        if (commandeId) {
            loadCommande();
        }
    }, [commandeId, executeCommandes]);

    if (!commandeInfo) {
        return <div className="text-muted-foreground">Chargement...</div>;
    }

    const percentageReceived = 0; // calcul détaillé dépend des réceptions agrégées

    return (
        <div className="space-y-1">
            <div className="font-medium text-sm">{commandeInfo.reference}</div>
            <div className="text-xs text-muted-foreground">
                {/* Détails réception non agrégés ici */}
                {commandeInfo.quantite} commandés
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${percentageReceived}%` }}
                />
            </div>
        </div>
    );
}

// Composant pour afficher le nom du produit
function ProduitName({ produitId }: { produitId: string }) {
    const [produitName, setProduitName] = useState<string>("");
    const { executeAsync: executeProduits } = useAction(listProducts);

    useEffect(() => {
        const loadProduit = async () => {
            try {
                const result = await executeProduits();
                type ProduitRef = { id: string; name: string };
                const produits = result?.data?.data as ProduitRef[] | undefined;
                if (produits) {
                    const produit = produits.find((p) => p.id === produitId);
                    setProduitName(produit?.name || produitId);
                }
            } catch (error) {
                console.error("Erreur lors du chargement du produit:", error);
            }
        };

        if (produitId) {
            loadProduit();
        }
    }, [produitId, executeProduits]);

    return <div className="font-medium">{produitName || produitId}</div>;
}

// Composant pour afficher le nom du tank
function TankName({ tankId }: { tankId: string | null }) {
    const [tankName, setTankName] = useState<string>("");
    const { executeAsync: executeTanks } = useAction(findAllTanks);

    useEffect(() => {
        const loadTank = async () => {
            try {
                const result = await executeTanks();
                if (result?.data?.success && result.data.result) {
                    type TankRef = { id: string; name: string };
                    const tank = (result.data.result as TankRef[]).find((t) => t.id === tankId);
                    setTankName(tank?.name || "Aucun tank");
                }
            } catch (error) {
                console.error("Erreur lors du chargement du tank:", error);
            }
        };

        if (tankId) {
            loadTank();
        }
    }, [tankId, executeTanks]);

    if (!tankId) {
        return <span className="text-muted-foreground text-sm">Aucun tank</span>;
    }

    return <div className="font-medium">{tankName || tankId}</div>;
}

// Définition des colonnes
export const columns: ColumnDef<Reception>[] = [
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
        size: 180,
        cell: ({ row }) => {
            const reference = row.getValue("reference") as string;
            return (
                <div className="font-medium">
                    {reference || `Réception ${row.original.id.slice(0, 8)}...`}
                </div>
            );
        },
        filterFn: multiColumnFilterFn,
        enableHiding: false,
    },
    {
        header: "Commande",
        accessorKey: "commandeId",
        size: 200,
        cell: ({ row }) => {
            const commandeId = row.getValue("commandeId") as string;
            return <CommandeInfo commandeId={commandeId} />;
        },
    },
    {
        header: "Produit",
        accessorKey: "produitId",
        size: 150,
        cell: ({ row }) => {
            const produitId = row.getValue("produitId") as string;
            return <ProduitName produitId={produitId} />;
        },
    },
    {
        header: "Quantité reçue",
        accessorKey: "quantity",
        size: 150,
        cell: ({ row }) => {
            const quantity = row.getValue("quantity") as number;
            const unit = row.original.unit;
            return (
                <div className="flex items-center gap-2">
                    <Scale className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">{quantity}</span>
                    <span className="text-muted-foreground">{unit}</span>
                </div>
            );
        },
    },
    {
        header: "Tank",
        accessorKey: "tankId",
        size: 150,
        cell: ({ row }) => {
            const tankId = row.getValue("tankId") as string | null;
            return <TankName tankId={tankId} />;
        },
    },
    {
        header: "Date de réception",
        accessorKey: "receptionDate",
        size: 180,
        cell: ({ row }) => {
            const date = row.getValue("receptionDate") as string;
            return (
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(date).toLocaleDateString('fr-FR')}</span>
                    <span className="text-muted-foreground">
                        {new Date(date).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        })}
                    </span>
                </div>
            );
        },
    },
    {
        header: "Statut",
        accessorKey: "receptionStatus",
        size: 120,
        cell: ({ row }) => {
            const status = row.getValue("receptionStatus") as string;
            const getStatusColor = (status: string) => {
                switch (status) {
                    case "RECEIVED": return "default";
                    case "IN_TRANSIT": return "outline";
                    case "CANCELLED": return "destructive";
                    default: return "outline";
                }
            };
            const getStatusText = (status: string) => {
                switch (status) {
                    case "RECEIVED": return "Reçue";
                    case "IN_TRANSIT": return "En transit";
                    case "CANCELLED": return "Annulée";
                    default: return status;
                }
            };
            return (
                <Badge variant={getStatusColor(status) as "default" | "destructive" | "outline"}>
                    {getStatusText(status)}
                </Badge>
            );
        },
    },
    {
        header: "Notes",
        accessorKey: "notes",
        size: 200,
        cell: ({ row }) => {
            const notes = row.getValue("notes") as string;
            if (!notes) {
                return <span className="text-muted-foreground text-sm">Aucune note</span>;
            }
            return (
                <div className="max-w-[200px] truncate" title={notes}>
                    {notes}
                </div>
            );
        },
    },
    {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => <RowActions row={row} />,
        size: 100,
        enableHiding: false,
    },
];

function RowActions({ row }: { row: Row<Reception> }) {
    
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="flex justify-end">
                    <Button size="icon" variant="ghost" className="shadow-none" aria-label="Actions">
                        <Ellipsis size={16} strokeWidth={2} aria-hidden="true" />
                    </Button>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/reception/views/${row.original.id}`} className="flex items-center justify-between w-full">
                            <span>Voir</span>
                            <Eye className="h-4 w-4" />
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/reception/${row.original.id}`} className="flex items-center justify-between w-full">
                            <span>Modifier</span>
                            <Edit className="h-4 w-4" />
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <DeleteReception 
                        receptionId={row.original.id} 
                        receptionReference={row.original.reference || `Réception ${row.original.id.slice(0, 8)}...`} 
                        onDelete={() => {}}
                    />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
