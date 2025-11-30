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
import { useState, useEffect } from "react";
import RemoveDialog from "./delete";
import { useAction } from "next-safe-action/hooks";
import { Badge } from "@/components/ui/badge";
import { getClients } from "@/app/dashboard/clients/actions";
import { listDepots } from "@/app/dashboard/depots/actions";
import { findAllAction as findAllTanks } from "@/app/dashboard/tank/actions";
import { listProducts } from "@/app/dashboard/products/actions";
import { Delivery } from "@/models/mvc";

// Local minimal reference types to avoid depending on missing exports
type ClientRef = { id: string; nom?: string };
type DepotRef = { id: string; name?: string };
type TankRef = { id: string; name?: string };
type ProduitRef = { id: string; nom?: string };

// Composants pour afficher les noms des relations
function ClientName({ clientId }: { clientId: string }) {
  const [clientName, setClientName] = useState<string>("");

  useEffect(() => {
    const loadClient = async () => {
      try {
        const items = await getClients();
        const client = (items as ClientRef[]).find((c) => c.id === clientId);
        if (client) setClientName(client.nom || "");
      } catch (error) {
        console.error("Erreur lors du chargement du client:", error);
      }
    };

    if (clientId) {
      loadClient();
    }
  }, [clientId]);

  return <span>{clientName || clientId}</span>;
}

function DepotName({ depotId }: { depotId: string }) {
  const [depotName, setDepotName] = useState<string>("");
  const { executeAsync } = useAction(listDepots);

  useEffect(() => {
    const loadDepot = async () => {
      try {
        const result = await executeAsync();
        const depots: DepotRef[] = ((result as any)?.data?.data ?? []) as DepotRef[];
        const depot = depots.find((d) => d.id === depotId);
        if (depot) setDepotName(depot.name || "");
      } catch (error) {
        console.error("Erreur lors du chargement du dépôt:", error);
      }
    };

    if (depotId) {
      loadDepot();
    }
  }, [depotId, executeAsync]);

  return <span>{depotName || depotId}</span>;
}

function TankName({ tankId }: { tankId: string }) {
  const [tankName, setTankName] = useState<string>("");
  const { executeAsync } = useAction(findAllTanks);

  useEffect(() => {
    const loadTank = async () => {
      try {
        const result = await executeAsync();
        const tanks: TankRef[] = ((result as any)?.data?.result ?? (result as any)?.data?.data ?? []) as TankRef[];
        const tank = tanks.find((t) => t.id === tankId);
        if (tank) setTankName(tank.name || "");
      } catch (error) {
        console.error("Erreur lors du chargement du tank:", error);
      }
    };

    if (tankId) {
      loadTank();
    }
  }, [tankId, executeAsync]);

  return <span>{tankName || tankId}</span>;
}

function ProduitName({ produitId }: { produitId: string }) {
  const [produitName, setProduitName] = useState<string>("");
  const { executeAsync } = useAction(listProducts);

  useEffect(() => {
    const loadProduit = async () => {
      try {
        const result = await executeAsync();
        const produits: ProduitRef[] = ((result as any)?.data?.data ?? (result as any)?.data?.result ?? []) as ProduitRef[];
        const produit = produits.find((p) => p.id === produitId);
        if (produit) setProduitName(produit.nom || "");
      } catch (error) {
        console.error("Erreur lors du chargement du produit:", error);
      }
    };

    if (produitId) {
      loadProduit();
    }
  }, [produitId, executeAsync]);

  return <span>{produitName || produitId}</span>;
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
export const columns: ColumnDef<Delivery>[] = [
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
        header: "Note",
        accessorKey: "note",
        cell: ({ row }) => <div className="font-medium">{row.getValue("note")}</div>,
        size: 120,
        filterFn: (row, columnId, filterValue) => {
            const searchableRowContent = `${row.original.note} ${row.original.typeAircraft ?? ''} ${row.original.flightNumber ?? ''}`.toLowerCase();
            const searchTerm = (filterValue ?? "").toLowerCase();
            return searchableRowContent.includes(searchTerm);
        },
        enableHiding: false,
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
            const original = row.original as Delivery;
            const clientId = original.clientId || "";
            return <ClientName clientId={clientId} />;
        },
        size: 120,
    },
    {
        header: "Dépôt",
        accessorKey: "depotId",
        cell: ({ row }) => {
            const original = row.original as Delivery;
            const depotId = original.depotId || "";
            return <DepotName depotId={depotId} />;
        },
        size: 120,
    },
    {
        header: "Tank",
        accessorKey: "tankId",
        cell: ({ row }) => {
            const original = row.original as Delivery;
            const tankId = original.tankId || "";
            return <TankName tankId={tankId} />;
        },
        size: 100,
    },
    {
        header: "Produit",
        accessorKey: "produitId",
        cell: ({ row }) => {
            const original = row.original as Delivery;
            const produitId = original.produitId || "";
            return <ProduitName produitId={produitId} />;
        },
        size: 120,
    },
    {
        header: "Type avion",
        accessorKey: "typeAircraft",
        cell: ({ row }) => {
            const original = row.original as Delivery;
            const typeAircraft = original.typeAircraft || "-";
            return <span>{typeAircraft}</span>;
        },
        size: 120,
    },
    {
        header: "Vol",
        accessorKey: "flightNumber",
        cell: ({ row }) => {
            const original = row.original as Delivery;
            const flightNumber = original.flightNumber || "-";
            return <span>{flightNumber}</span>;
        },
        size: 100,
    },
    // Horaires retiré: champs non présents dans le schéma actuel
    {
        header: "Compteurs",
        cell: ({ row }) => {
            const original = row.original as Delivery;
            const openingEter = original.openingEter || 0;
            const closingEter = original.closingEter || 0;
            const difference = closingEter - openingEter;
            return (
                <div className="text-xs">
                    <div>Ouverture: {openingEter}</div>
                    <div>Fermeture: {closingEter}</div>
                    <div className="font-medium text-blue-600">Diff: {difference}</div>
                </div>
            );
        },
        size: 120,
    },
    {
        header: "Prix unitaire",
        accessorKey: "prixUnitaire",
        cell: ({ row }) => {
            const original = row.original as Delivery;
            const prix = original.prixUnitaire || 0;
            return <span>{prix ? `${prix.toFixed(2)} USD` : "-"}</span>;
        },
        size: 120,
    },
    {
        header: "Paiement",
        accessorKey: "paiement",
        cell: ({ row }) => {
            const original = row.original as Delivery;
            const paiement = original.paiement || "CREDIT";
            return (
                <Badge className={getPaiementColor(paiement)}>
                    {getPaiementText(paiement)}
                </Badge>
            );
        },
        size: 100,
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

function RowActions({ row }: { row: Row<Delivery> }) {
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
