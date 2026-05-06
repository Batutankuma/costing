"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import * as XLSX from "xlsx";
import { Upload, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { importHospitalityRows } from "./actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

type TemplateOptions = {
  suppliers: Array<{ id: string; nom: string }>;
  transporters: Array<{ id: string; nom: string }>;
  depots: Array<{ id: string; name: string }>;
  commandes: Array<{ id: string; reference: string; depotId: string | null }>;
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

export default function ImportHospitalityExcel({ options }: { options: TemplateOptions }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ParsedHospitalityRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [selectedTransporterId, setSelectedTransporterId] = useState("");
  const [selectedDepotId, setSelectedDepotId] = useState("");
  const [selectedCommandeId, setSelectedCommandeId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const availableCommandes = useMemo(
    () => options.commandes.filter((item) => !selectedDepotId || item.depotId === selectedDepotId),
    [options.commandes, selectedDepotId]
  );

  const reset = () => {
    setRows([]);
    setFileName("");
    setSelectedSupplierId("");
    setSelectedTransporterId("");
    setSelectedDepotId("");
    setSelectedCommandeId("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadTemplate = () => {
    const generate = async () => {
      const ExcelJS = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      const template = workbook.addWorksheet("HospitalityTemplate");
      const refs = workbook.addWorksheet("ListesReference");

      const headers = [
        "Driver s name",
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
      template.addRow(headers);
      template.addRow([
        "",
        "TRK-120",
        "TRL-450",
        "2026-04-13",
        "2026-04-14",
        "2026-04-15",
        35000,
        34980,
        34970,
        34960,
        0.25,
      ]);

      refs.addRow(["SUPPLIER", "TRANSPORTER", "Depot", "Commande"]);
      const maxLen = Math.max(options.suppliers.length, options.transporters.length, options.depots.length, options.commandes.length);
      for (let i = 0; i < maxLen; i += 1) {
        refs.addRow([
          options.suppliers[i]?.nom || "",
          options.transporters[i]?.nom || "",
          options.depots[i]?.name || "",
          options.commandes[i]?.reference || "",
        ]);
      }

      refs.state = "veryHidden";
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "hospitality-import-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    };

    void generate();
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
          !driverName ||
          !truckNo || !trailerNo || !loadingDate || !entryDate || !offlDate ||
          !Number.isFinite(quantityOrder) || !Number.isFinite(actualQuantity20L) ||
          !Number.isFinite(offlQtyObs) || !Number.isFinite(offlQty20) || !Number.isFinite(rate)
        ) {
          throw new Error(`Ligne ${rowNo}: données manquantes ou invalides`);
        }

        return {
          driverName,
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
    const selectedSupplier = options.suppliers.find((item) => item.id === selectedSupplierId);
    const selectedTransporter = options.transporters.find((item) => item.id === selectedTransporterId);
    const selectedDepot = options.depots.find((item) => item.id === selectedDepotId);
    const selectedCommande = options.commandes.find((item) => item.id === selectedCommandeId);
    if (!selectedSupplier || !selectedTransporter || !selectedDepot || !selectedCommande) {
      toast({
        variant: "destructive",
        title: "Sélection incomplète",
        description: "Veuillez sélectionner supplier, transporter, dépôt et bon de commande avant l'import.",
      });
      return;
    }
    if (selectedCommande.depotId && selectedCommande.depotId !== selectedDepotId) {
      toast({
        variant: "destructive",
        title: "Incohérence dépôt/commande",
        description: "Le bon de commande sélectionné n'appartient pas au dépôt choisi.",
      });
      return;
    }
    setLoading(true);
    console.info("[hospitality/import] Début import. Lignes:", rows.length);
    try {
      const payload = rows.map((row) => ({
        ...row,
        supplierName: selectedSupplier.nom,
        transporterName: selectedTransporter.nom,
        depotName: selectedDepot.name,
        commandeReference: selectedCommande.reference,
      }));
      const result = await importHospitalityRows(payload);
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
            Sélectionnez supplier/transporter/dépôt/commande dans l&apos;application, puis importez le fichier Excel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Supplier</Label>
              <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {options.suppliers.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Transporter</Label>
              <Select value={selectedTransporterId} onValueChange={setSelectedTransporterId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {options.transporters.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Dépôt</Label>
              <Select
                value={selectedDepotId}
                onValueChange={(value) => {
                  setSelectedDepotId(value);
                  setSelectedCommandeId("");
                }}
              >
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {options.depots.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Bon de commande</Label>
              <Select value={selectedCommandeId} onValueChange={setSelectedCommandeId}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {availableCommandes.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.reference}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
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
