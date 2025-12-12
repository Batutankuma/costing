"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { listQuotes } from "./actions";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import DataTable from "./data-table";
import { SalesQuote } from "./columns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  const { data: session } = authClient.useSession();
  const [items, setItems] = useState<SalesQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const role = session?.user?.role as "ADMIN" | "COMMERCIAL" | undefined;
        const userId = session?.user?.id;
        const payload = role === "ADMIN" ? undefined : userId ? { userId } : undefined;
        const res = await listQuotes(payload);
        const rows = res.data?.success ? res.data.result : [];
        setItems(rows);
      } catch (error) {
        console.error("Error loading quotes:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [session?.user?.id, session?.user?.role]);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <FileText className="h-8 w-8 text-primary" />
                Devis Commerciaux
              </h1>
              <p className="text-muted-foreground">Gestion des devis et proformas</p>
            </div>
            <Button disabled>
              Nouveau Devis
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
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileText className="h-8 w-8 text-primary" />
              Devis Commerciaux
            </h1>
            <p className="text-muted-foreground">Gestion des devis et proformas</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/sales-quotes/create">
              <Button>
                Nouveau Devis
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Devis</CardTitle>
          <CardDescription>Visualisez et gérez tous vos devis commerciaux et proformas</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable items={items} />
        </CardContent>
      </Card>
    </div>
  );
}


