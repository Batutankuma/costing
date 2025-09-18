"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { listQuotes } from "./actions";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import DataTable from "./data-table";
import { SalesQuote } from "./columns";

export default function Page() {
  const { data: session } = authClient.useSession();
  const [items, setItems] = useState<SalesQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const role = (session?.user as any)?.role as "ADMIN" | "COMMERCIAL" | undefined;
        const userId = session?.user?.id;
        const payload = role === "ADMIN" ? undefined : { userId };
        const res = await listQuotes(payload as any);
        const rows = (res as any)?.data?.result ?? [];
        setItems(rows);
      } catch (error) {
        console.error("Error loading quotes:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [session?.user?.id, (session?.user as any)?.role]);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Devis</h1>
              <p className="text-muted-foreground">Gestion des devis commerciaux</p>
            </div>
            <Button disabled>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau devis
            </Button>
          </div>
        </div>
        <div className="text-center py-8 text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Devis</h1>
            <p className="text-muted-foreground">Gestion des devis commerciaux</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/sales-quotes/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau devis
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <DataTable items={items} />
    </div>
  );
}


