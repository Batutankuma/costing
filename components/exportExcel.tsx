"use client";

import { Button } from "./button";
import { Download } from "lucide-react";

interface ExportExcelProps<T = any> {
  data: T[];
  filename: string;
  mapRow?: (row: T) => Record<string, unknown>;
  className?: string;
  customCsv?: string; // If provided, use this CSV content directly
  customHtml?: string; // If provided, export as styled Excel (HTML table)
}

export default function ExportExcel<T = any>({ data, filename, mapRow, className, customCsv, customHtml }: ExportExcelProps<T>) {
  const exportFile = () => {
    if (customHtml) {
      const blob = new Blob([`\ufeff${customHtml}`], { type: "application/vnd.ms-excel;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.xls`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    let csvContent = customCsv ?? "";
    if (!csvContent) {
      if (!data || data.length === 0) {
        alert("No data to export");
        return;
      }

      const normalized = mapRow ? data.map(mapRow) : (data as unknown as Record<string, unknown>[]);

      // Get headers from the first data item
      const headers = Object.keys(normalized[0] || {});
      
      // Create CSV content
      csvContent = [
        headers.join(","), // Header row
        ...normalized.map(row => 
          headers.map(header => {
            const value = (row as any)[header];
            // Handle values that need quotes (contain commas, quotes, or newlines)
            if (value === null || value === undefined) return "";
            const stringValue = String(value);
            if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(",")
        )
      ].join("\n");
    }

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button
      variant="outline"
      onClick={exportFile}
      className={`flex items-center gap-2${className ? ` ${className}` : ""}`}
    >
      <Download size={16} />
      Export Excel
    </Button>
  );
}
