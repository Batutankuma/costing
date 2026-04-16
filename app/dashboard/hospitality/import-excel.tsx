"use client";

import { useRef, useState, type ChangeEvent } from "react";
import * as XLSX from "xlsx";
import { Upload, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { importHospitalityRows } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ParsedHospitalityRow = {
  driverName: string;
  supplierName: string;
  transporterName: string;
  depotName: string;
  stockReference?: string;
  truckNo: string;
  trailerNo: string;
  loadingDate: string;
  entryDate: string;
  offlDate: string;
  quantityOrder: number;
  actualQuantity20L: number;
  offlQtyObs: number;
  offlQty20: number;
  rate: number;
};

function asNumber(value: unknown) {
  const normalized = String(value ?? "").replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function asDateString(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "number") {
    const excelDate = XLSX.SSF.parse_date_code(value);
    if (!excelDate) return "";
    return new Date(Date.UTC(excelDate.y, excelDate.m - 1, excelDate.d)).toISOString();
  }
  const text = String(value ?? "").trim();
  if (!text) return "";
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function pick(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
      return row[key];
    }
  }
  return "";
}

export default function ImportHospitalityExcel() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ParsedHospitalityRow[]>([]);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const reset = () => {
    setRows([]);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadTemplate = () => {
    const headers = [
      "Driver s name",
      "SUPPLIER",
      "TRANSPORTER",
      "Depot",
      "Stock (optionnel)",
      "Truck No.",
      "Trailer No.",
      "LOADING DATE",
      "ENTRY DATE",
      "OFFL DATE",
      "Quantity Order",
      "Actual quantity @20 (L)",
      "OFFL QTY @OBS",
      "OFFL QTY @20",
      "Rate ($)",
    ];

    const sampleRow = {
      "Driver s name": "MUKADI",
      SUPPLIER: "FOURNISSEUR DEMO",
      TRANSPORTER: "TRANSPORTEUR DEMO",
      Depot: "DEPOT LUBUMBASHI",
      "Stock (optionnel)": "",
      "Truck No.": "TRK-120",
      "Trailer No.": "TRL-450",
      "LOADING DATE": "2026-04-13",
      "ENTRY DATE": "2026-04-14",
      "OFFL DATE": "2026-04-15",
      "Quantity Order": 35000,
      "Actual quantity @20 (L)": 34980,
      "OFFL QTY @OBS": 34970,
      "OFFL QTY @20": 34960,
      "Rate ($)": 0.25,
    };

    const worksheet = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "HospitalityTemplate");
    XLSX.writeFile(workbook, "hospitality-import-template.xlsx");
  };

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    console.info("[hospitality/import] Fichier sélectionné:", file.name);
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls") && !lower.endsWith(".csv")) {
      toast({
        variant: "destructive",
        title: "Format invalide",
        description: "Veuillez sélectionner un fichier .xlsx, .xls ou .csv",
      });
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
      console.info("[hospitality/import] Lignes brutes détectées:", rawRows.length);
      const parsedRows: ParsedHospitalityRow[] = rawRows.map((raw, index) => {
        const rowNo = index + 2;
        const driverName = String(pick(raw, ["Driver s name", "DRIVER", "driverName"])).trim();
        const supplierName = String(pick(raw, ["SUPPLIER", "Supplier"])).trim();
        const transporterName = String(pick(raw, ["TRANSPORTER", "Transporter"])).trim();
        const depotName = String(pick(raw, ["Depot", "DEPOT"])).trim();
        const stockReference = String(pick(raw, ["Stock", "STOCK", "Stock (optionnel)"])).trim();
        const truckNo = String(pick(raw, ["Truck No.", "Truck No", "TRUCK NO"])).trim();
        const trailerNo = String(pick(raw, ["Trailer No.", "Trailer No", "TRAILER NO"])).trim();
        const loadingDate = asDateString(pick(raw, ["LOADING DATE", "Loading Date"]));
        const entryDate = asDateString(pick(raw, ["ENTRY DATE", "Entry Date"]));
        const offlDate = asDateString(pick(raw, ["OFFL DATE", "Offl Date"]));
        const quantityOrder = asNumber(pick(raw, ["Quantity Order", "QUANTITY ORDER"]));
        const actualQuantity20L = asNumber(pick(raw, ["Actual quantity @20 (L)", "ACTUAL QUANTITY @20"]));
        const offlQtyObs = asNumber(pick(raw, ["OFFL QTY @OBS", "OFFL QTY OBS"]));
        const offlQty20 = asNumber(pick(raw, ["OFFL QTY @20", "OFFL QTY 20"]));
        const rate = asNumber(pick(raw, ["Rate ($)", "RATE"]));

        if (
          !driverName || !supplierName || !transporterName || !depotName ||
          !truckNo || !trailerNo || !loadingDate || !entryDate || !offlDate ||
          !Number.isFinite(quantityOrder) || !Number.isFinite(actualQuantity20L) ||
          !Number.isFinite(offlQtyObs) || !Number.isFinite(offlQty20) || !Number.isFinite(rate)
        ) {
          throw new Error(`Ligne ${rowNo}: données manquantes ou invalides`);
        }

        return {
          driverName,
          supplierName,
          transporterName,
          depotName,
          stockReference,
          truckNo,
          trailerNo,
          loadingDate,
          entryDate,
          offlDate,
          quantityOrder,
          actualQuantity20L,
          offlQtyObs,
          offlQty20,
          rate,
        };
      });

      setRows(parsedRows);
      setFileName(file.name);
      console.info("[hospitality/import] Lignes valides prêtes:", parsedRows.length);
      toast({ title: "Fichier prêt", description: `${parsedRows.length} ligne(s) détectée(s).` });
    } catch (error) {
      console.error("[hospitality/import] Erreur parsing fichier:", error);
      setRows([]);
      setFileName("");
      toast({
        variant: "destructive",
        title: "Erreur de lecture",
        description: error instanceof Error ? error.message : "Impossible de lire le fichier",
      });
    }
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setLoading(true);
    console.info("[hospitality/import] Début import. Lignes:", rows.length);
    try {
      const result = await importHospitalityRows(rows);
      console.info("[hospitality/import] Réponse action:", result);
      if (!result?.data?.success) {
        throw new Error(result?.data?.failure ?? "Import impossible");
      }

      const imported = result.data.success.imported;
      const errors = result.data.success.errors;
      if (errors.length > 0) {
        console.warn("[hospitality/import] Erreurs d'import:", errors);
      }
      if (errors.length > 0) {
        toast({
          variant: "destructive",
          title: "Import partiel",
          description: `${imported} importé(s), ${errors.length} erreur(s).`,
        });
      } else {
        toast({ title: "Import terminé", description: `${imported} ligne(s) importée(s).` });
      }
      router.refresh();
      if (errors.length === 0) {
        reset();
        setOpen(false);
      }
    } catch (error) {
      console.error("[hospitality/import] Échec import:", error);
      toast({
        variant: "destructive",
        title: "Échec import",
        description: error instanceof Error ? error.message : "Erreur inconnue",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importer Excel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Hospitality</DialogTitle>
          <DialogDescription>
            Importez un fichier Excel/CSV avec les colonnes hospitality (supplier, transporter, depot, stock optionnel).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Button type="button" variant="secondary" onClick={downloadTemplate} className="w-full gap-2">
            <Download className="h-4 w-4" />
            Télécharger le template Excel
          </Button>
          <Label htmlFor="hospitality-import-file">Fichier</Label>
          <input
            id="hospitality-import-file"
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileSelect}
            disabled={loading}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            {fileName || "Sélectionner un fichier"}
          </Button>
          <p className="text-sm text-muted-foreground">
            {rows.length > 0 ? `${rows.length} ligne(s) prête(s) à importer.` : "Aucune ligne chargée."}
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={reset} disabled={loading}>
            Réinitialiser
          </Button>
          <Button type="button" onClick={handleImport} disabled={loading || rows.length === 0}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Valider et importer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
