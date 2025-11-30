'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Edit } from "lucide-react";
import Link from "next/link";
import { DeleteDepot } from "./delete";

type DepotWithProducts = {
  id: string;
  name: string;
  type: "OWNED" | "EXTERNAL";
  location?: string | null;
  products?: Array<{ id: string; quantity: number; product?: { name: string; unit: string } }>;
};

export const columns: ColumnDef<DepotWithProducts>[] = [
  { accessorKey: "name", header: "Nom" },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.type === "OWNED" ? "Interne" : "Externe"}</Badge>
    ),
  },
  {
    id: "products",
    header: "Produits liés",
    cell: ({ row }) => {
      const items = row.original.products ?? [];
      if (!items.length) return <span className="text-muted-foreground">Aucun</span>;
      const summary = items
        .slice(0, 3)
        .map((dp) => `${dp.product?.name ?? "?"} (${dp.quantity ?? 0})`)
        .join(", ");
      const more = items.length > 3 ? ` +${items.length - 3}` : "";
      return <span className="text-sm">{summary}{more}</span>;
    },
  },
  {
    accessorKey: "location",
    header: "Localisation",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const depot = row.original;
      return (
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/depots/views/${depot.id}`}>
            <Button variant="ghost" className="h-8 px-2"><Eye className="h-4 w-4" /></Button>
          </Link>
          <Link href={`/dashboard/depots/${depot.id}`}>
            <Button variant="ghost" className="h-8 px-2"><Edit className="h-4 w-4" /></Button>
          </Link>
          <DeleteDepot id={depot.id} name={depot.name} />
        </div>
      );
    },
  },
];
