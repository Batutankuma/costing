"use client";

import { Button } from "@/components/ui/button";
import { Edit, Download } from "lucide-react";
import Link from "next/link";
import ExportExcel from "@/components/exportExcel";

export function NonMiningBuilderActionsBar({ id, customHtml }: { id: string; customHtml?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Link href={`/dashboard/non-mining-builders/${id}`}>
        <Button size="sm">
          <Edit className="mr-2 h-4 w-4" /> Modifier
        </Button>
      </Link>
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Download className="mr-2 h-4 w-4" /> Imprimer
      </Button>
      <ExportExcel data={[]} filename={`builder-non-minier-${id}`} customHtml={customHtml}
      />
    </div>
  );
}


