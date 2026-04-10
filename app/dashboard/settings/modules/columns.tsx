'use client';

import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef, FilterFn } from "@tanstack/react-table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ellipsis } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import RemoveDialog from "./delete";
import { DropdownMenuShortcut } from "@/components/ui/dropdown-menu";

type Module = {
    id: string;
    name: string;
    type: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: {
        userModules: number;
    };
};

const multiColumnFilterFn: FilterFn<Module> = (row, columnId, filterValue) => {
    const searchableRowContent = `${row.original.name} ${row.original.type} ${row.original.description ?? ''}`.toLowerCase();
    const searchTerm = (filterValue ?? "").toLowerCase();
    return searchableRowContent.includes(searchTerm);
};

const getModuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
        FINANCE: "Finance",
        CRM: "CRM",
        DEPOT_AUTRES: "Dépôt Autres",
        DEPOT_KALEMIE: "Dépôt Kalemie",
        DEPOT_LUBUMBASHI: "Dépôt Lubumbashi",
        DEPOT_KINSHASA: "Dépôt Kinshasa",
        OPERATION: "Opération",
    };
    return labels[type] || type;
};

export const columns: ColumnDef<Module>[] = [
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
        header: "Nom",
        accessorKey: "name",
        cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
        size: 200,
        filterFn: multiColumnFilterFn,
        enableHiding: false,
    },
    {
        header: "Type",
        accessorKey: "type",
        cell: ({ row }) => (
            <Badge variant="outline">{getModuleTypeLabel(row.getValue("type"))}</Badge>
        ),
        size: 150,
    },
    {
        header: "Description",
        accessorKey: "description",
        cell: ({ row }) => <div className="max-w-xs truncate">{row.getValue("description") || "-"}</div>,
        size: 250,
    },
    {
        header: "Utilisateurs",
        accessorKey: "_count.userModules",
        cell: ({ row }) => {
            const count = row.original._count?.userModules || 0;
            return <div>{count}</div>;
        },
        size: 100,
    },
    {
        header: "Statut",
        accessorKey: "isActive",
        cell: ({ row }) => (
            <Badge variant={row.getValue("isActive") ? "default" : "secondary"}>
                {row.getValue("isActive") ? "Actif" : "Inactif"}
            </Badge>
        ),
        size: 100,
    },
    {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => <RowActions row={row} />,
        size: 60,
        enableHiding: false,
    },
];

function RowActions({ row }: { row: { original: Module } }) {
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
                        <Link href={`/dashboard/settings/modules/views/${row.original.id}`}>
                            <span>Voir</span>
                            <DropdownMenuShortcut>⌘V</DropdownMenuShortcut>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/dashboard/settings/modules/${row.original.id}`}>
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
            <RemoveDialog open={openRemoveDialog} setOpen={setOpenRemoveDialog} Id={row.original.id} nameModule={row.original.name} />
        </DropdownMenu>
    );
}
