"use client";

import { useRef, useState, type ChangeEvent } from "react";
import * as XLSX from "xlsx";
import { Upload, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { importDeliveryRows } from "./actions";
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

type ParsedDeliveryRow = {
  commandNumber: string;
  truckTrailerNo: string;
  driverName: string;
  truckCapacity: number;
  qLoaded: number;
  temperature: number;
  density: number;
  q20: number;
  loadingDate: string;
  qOffloaded: number;
  dateOffloaded: string;
  departureDate: string;
  etaDate: string;
  ataDate: string;
  eod: string;
  remarks: string;
  rate: number;
};

type TemplateOptions = {
  clients: Array<{ id: string; name: string }>;
  transporters: Array<{ id: string; nom: string }>;
  depots: Array<{ id: string; name: string }>;
  products: Array<{ id: string; nom: string }>;
  clientOrders: Array<{
    id: string;
    reference: string;
    clientId: string;
    produitId: string;
    unitPrice: number;
    clientName: string;
    productName: string;
  }>;
};

function asNumber(value: unknown) {
  const n = Number(String(value ?? "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : Number.NaN;
}

function asDateString(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") {
    const code = XLSX.SSF.parse_date_code(value);
    if (!code) return "";
    return new Date(Date.UTC(code.y, code.m - 1, code.d)).toISOString();
  }
  const text = String(value ?? "").trim();
  if (!text) return "";
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function pick(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "";
}

export default function ImportDeliveryExcel({ options }: { options: TemplateOptions }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<ParsedDeliveryRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedDestinationClientId, setSelectedDestinationClientId] = useState("");
  const [selectedTransporterId, setSelectedTransporterId] = useState("");
  const [selectedDepotId, setSelectedDepotId] = useState("");
  const [selectedProduitId, setSelectedProduitId] = useState("");
  const [selectedClientOrderId, setSelectedClientOrderId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const reset = () => {
    setRows([]);
    setFileName("");
    setSelectedClientId("");
    setSelectedDestinationClientId("");
    setSelectedTransporterId("");
    setSelectedDepotId("");
    setSelectedProduitId("");
    setSelectedClientOrderId("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadTemplate = async () => {
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("DeliveryTemplate");
    const refs = workbook.addWorksheet("ListesReference");
    const headers = [
      "Num Commande",
      "Truck & Trailer No",
      "Driver Name",
      "Truck Capacity",
      "Q Loaded",
      "Temp",
      "Dens",
      "Q @20",
      "Date of Loading",
      "Q Offloaded",
      "Date Offloaded",
      "Departure Date",
      "ETA",
      "ATA",
      "EOD",
      "Remarks",
      "Rate ($)",
    ];
    sheet.addRow(headers);
    sheet.addRow([
      "CMD-001",
      "TRK-01 / TRL-01",
      "Jean",
      36000,
      35000,
      30,
      0.82,
      34980,
      "2026-04-22",
      34950,
      "2026-04-23",
      "2026-04-23",
      "2026-04-24",
      "2026-04-24",
      "RAS",
      "",
      0.25,
    ]);

    refs.addRow(["Clients", "Transporters", "Depots"]);
    const maxLen = Math.max(options.clients.length, options.transporters.length, options.depots.length);
    for (let i = 0; i < maxLen; i += 1) {
      refs.addRow([
        options.clients[i]?.name || "",
        options.transporters[i]?.nom || "",
        options.depots[i]?.name || "",
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
    a.download = "delivery-lbb-import-template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    console.info("[delivery/import] Fichier sélectionné:", file.name);
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
      console.info("[delivery/import] Lignes brutes détectées:", rawRows.length);

      const parsedRows = rawRows.map((raw, i) => {
        const rowNo = i + 2;
        const commandNumber = String(pick(raw, ["Num Commande"])).trim();
        const truckTrailerNo = String(pick(raw, ["Truck & Trailer No"])).trim();
        const driverName = String(pick(raw, ["Driver Name"])).trim();
        const truckCapacity = asNumber(pick(raw, ["Truck Capacity"]));
        const qLoaded = asNumber(pick(raw, ["Q Loaded"]));
        const temperature = asNumber(pick(raw, ["Temp"]));
        const density = asNumber(pick(raw, ["Dens"]));
        const q20 = asNumber(pick(raw, ["Q @20"]));
        const loadingDate = asDateString(pick(raw, ["Date of Loading"]));
        const qOffloaded = asNumber(pick(raw, ["Q Offloaded"]));
        const dateOffloaded = asDateString(pick(raw, ["Date Offloaded"]));
        const departureDate = asDateString(pick(raw, ["Departure Date"]));
        const etaDate = asDateString(pick(raw, ["ETA"]));
        const ataDate = asDateString(pick(raw, ["ATA"]));
        const eod = String(pick(raw, ["EOD"])).trim();
        const remarks = String(pick(raw, ["Remarks"])).trim();
        const rate = asNumber(pick(raw, ["Rate ($)"]));

        if (!loadingDate || !dateOffloaded || !Number.isFinite(rate)) {
          throw new Error(`Ligne ${rowNo}: données obligatoires manquantes`);
        }
        return {
          commandNumber,
          truckTrailerNo,
          driverName,
          truckCapacity: Number.isFinite(truckCapacity) ? truckCapacity : 0,
          qLoaded: Number.isFinite(qLoaded) ? qLoaded : 0,
          temperature: Number.isFinite(temperature) ? temperature : 0,
          density: Number.isFinite(density) ? density : 0,
          q20: Number.isFinite(q20) ? q20 : 0,
          loadingDate,
          qOffloaded: Number.isFinite(qOffloaded) ? qOffloaded : 0,
          dateOffloaded,
          departureDate,
          etaDate,
          ataDate,
          eod,
          remarks,
          rate,
        };
      });

      setRows(parsedRows);
      setFileName(file.name);
      console.info("[delivery/import] Lignes valides prêtes:", parsedRows.length);
      toast({ title: "Fichier prêt", description: `${parsedRows.length} ligne(s) détectée(s).` });
    } catch (error) {
      console.error("[delivery/import] Erreur parsing fichier:", error);
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
    const selectedDepot = options.depots.find((d) => d.id === selectedDepotId);
    const selectedClientOrder = options.clientOrders.find((o) => o.id === selectedClientOrderId);
    const effectiveClientId = selectedClientOrder?.clientId || selectedClientId;
    const effectiveProduitId = selectedClientOrder?.produitId || selectedProduitId;
    if (!effectiveClientId || !selectedTransporterId || !selectedDepot || !selectedDestinationClientId || !effectiveProduitId) {
      toast({
        variant: "destructive",
        title: "Sélection incomplète",
        description: "Sélectionnez Destination, Transporter, Dépôt et (Bon client ou Client+Produit) avant import.",
      });
      return;
    }
    setLoading(true);
    console.info("[delivery/import] Début import. Lignes:", rows.length);
    try {
      const payload = rows.map((row) => ({
        ...row,
        commandNumber: row.commandNumber || selectedClientOrder?.reference || "",
        clientId: effectiveClientId,
        destinationClientId: selectedDestinationClientId,
        transporterId: selectedTransporterId,
        depotId: selectedDepot.id,
        produitId: effectiveProduitId,
        // Applique le prix du bon client si fourni et si le taux est absent/invalide
        rate: Number.isFinite(Number(row.rate)) && Number(row.rate) > 0
          ? row.rate
          : Number(selectedClientOrder?.unitPrice || 0),
      }));
      console.info("[delivery/import] Payload prêt:", {
        rows: payload.length,
        selectedClientId: effectiveClientId,
        selectedDestinationClientId,
        selectedTransporterId,
        selectedDepotId,
        selectedProduitId: effectiveProduitId,
        selectedClientOrderId,
      });
      const result = await importDeliveryRows(payload);
      console.info("[delivery/import] Réponse action:", result);
      if (!result?.data?.success) throw new Error(result?.data?.failure || "Import impossible");

      const { imported, errors } = result.data.success;
      if (errors.length > 0) {
        console.warn("[delivery/import] Erreurs retournées:", errors);
      }
      if (errors.length > 0) {
        toast({ variant: "destructive", title: "Import partiel", description: `${imported} importé(s), ${errors.length} erreur(s).` });
      } else {
        toast({ title: "Import terminé", description: `${imported} ligne(s) importée(s).` });
      }
      router.refresh();
      if (errors.length === 0) {
        reset();
        setOpen(false);
      }
    } catch (error) {
      console.error("[delivery/import] Échec import:", error);
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
          <DialogTitle>Import DeliveryLBB</DialogTitle>
          <DialogDescription>Importez des lignes via un template Excel.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1 md:col-span-2">
              <Label>Bon de commande client (optionnel)</Label>
              <Select
                value={selectedClientOrderId}
                onValueChange={(value) => {
                  setSelectedClientOrderId(value);
                  const order = options.clientOrders.find((o) => o.id === value);
                  if (!order) return;
                  // Par défaut, la destination suit le client du bon.
                  setSelectedDestinationClientId(order.clientId);
                }}
              >
                <SelectTrigger className="w-full [&>span]:truncate"><SelectValue placeholder="Sélectionner un bon..." /></SelectTrigger>
                <SelectContent>
                  {options.clientOrders.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <span className="block max-w-[520px] truncate">
                        {item.reference} - {item.clientName} - {item.productName}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Client</Label>
              <Select value={selectedClientOrderId ? (options.clientOrders.find((o) => o.id === selectedClientOrderId)?.clientId || "") : selectedClientId} onValueChange={setSelectedClientId} disabled={Boolean(selectedClientOrderId)}>
                <SelectTrigger className="w-full [&>span]:truncate"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {options.clients.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <span className="block max-w-[260px] truncate">{item.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Destination</Label>
              <Select value={selectedDestinationClientId} onValueChange={setSelectedDestinationClientId}>
                <SelectTrigger className="w-full [&>span]:truncate"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {options.clients.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <span className="block max-w-[260px] truncate">{item.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Transporter</Label>
              <Select value={selectedTransporterId} onValueChange={setSelectedTransporterId}>
                <SelectTrigger className="w-full [&>span]:truncate"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {options.transporters.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <span className="block max-w-[260px] truncate">{item.nom}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Dépôt</Label>
              <Select value={selectedDepotId} onValueChange={setSelectedDepotId}>
                <SelectTrigger className="w-full [&>span]:truncate"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {options.depots.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <span className="block max-w-[260px] truncate">{item.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Produit</Label>
              <Select value={selectedClientOrderId ? (options.clientOrders.find((o) => o.id === selectedClientOrderId)?.produitId || "") : selectedProduitId} onValueChange={setSelectedProduitId} disabled={Boolean(selectedClientOrderId)}>
                <SelectTrigger className="w-full [&>span]:truncate"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {options.products.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <span className="block max-w-[260px] truncate">{item.nom}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="button" variant="secondary" onClick={() => void downloadTemplate()} className="w-full gap-2">
            <Download className="h-4 w-4" />
            Télécharger le template Excel
          </Button>

          <Label htmlFor="delivery-import-file">Fichier</Label>
          <input
            id="delivery-import-file"
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileSelect}
            disabled={loading}
          />
          <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()} disabled={loading}>
            {fileName || "Sélectionner un fichier"}
          </Button>
          <p className="text-sm text-muted-foreground">
            {rows.length > 0 ? `${rows.length} ligne(s) prête(s) à importer.` : "Aucune ligne chargée."}
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={reset} disabled={loading}>Réinitialiser</Button>
          <Button type="button" onClick={handleImport} disabled={loading || rows.length === 0}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Valider et importer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

