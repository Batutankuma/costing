"use client";

import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportButtonsProps {
  data: any[];
  filename?: string;
}

export function ExportButtons({ data, filename = "prix-non-minier" }: ExportButtonsProps) {
  const handleExportExcel = () => {
    // Logique d'export Excel
    console.log("Export Excel:", data);
    // Ici vous pouvez implémenter l'export Excel
  };

  const handleExportPDF = () => {
    // Logique d'export PDF
    console.log("Export PDF:", data);
    // Ici vous pouvez implémenter l'export PDF
  };

  const handleExportCSV = () => {
    // Logique d'export CSV
    console.log("Export CSV:", data);
    // Ici vous pouvez implémenter l'export CSV
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportExcel}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="h-4 w-4 mr-2" />
          PDF (.pdf)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileText className="h-4 w-4 mr-2" />
          CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
