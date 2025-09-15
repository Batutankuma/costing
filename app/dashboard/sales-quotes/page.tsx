"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { listQuotes } from "./actions";

export default function Page() {
  const { data: session } = authClient.useSession();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const role = (session?.user as any)?.role as "ADMIN" | "COMMERCIAL" | undefined;
      const userId = session?.user?.id;
      const payload = role === "ADMIN" ? undefined : { userId };
      const res = await listQuotes(payload as any);
      const rows = (res as any)?.data?.result ?? [];
      setItems(rows);
    })();
  }, [session?.user?.id, (session?.user as any)?.role]);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Devis</h1>
        <Link href="/dashboard/sales-quotes/create" className="underline">Nouveau devis</Link>
      </div>
      <div className="overflow-auto rounded border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left p-2">Date</th>
              <th className="text-left p-2">N° Proforma</th>
              <th className="text-left p-2">Auteur</th>
              <th className="text-right p-2">DDU (USD)</th>
              <th className="text-right p-2">DDP (USD)</th>
              <th className="text-left p-2">Client</th>
            </tr>
          </thead>
          <tbody>
            {items.map((q: any) => (
              <tr key={q.id} className="border-t">
                <td className="p-2">{new Date(q.createdAt).toLocaleDateString("fr-FR")}</td>
                <td className="p-2">{q.proformaNumber || "—"}</td>
                <td className="p-2"><Link href={`/dashboard/sales-quotes/${q.id}`} className="underline">{q.user?.name || "—"}</Link></td>
                <td className="p-2 text-right">{Number(q.totalDDUUSD || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td>
                <td className="p-2 text-right">{Number(q.totalDDPUSD || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</td>
                <td className="p-2">{q.client?.name || "—"}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="p-4 text-center text-muted-foreground" colSpan={6}>Aucun devis</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


