"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2, Check, X, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAction } from "next-safe-action/hooks";
import { importShipments } from "../actions";
import { getClients } from "@/app/dashboard/clients/actions";
import { listDepots } from "@/app/dashboard/depots/actions";
import { listProducts } from "@/app/dashboard/products/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ParsedShipment = {
  numerobl: string;
  date: Date;
  quantite: number;
  unite: "KG" | "G" | "L" | "ML" | "TONNE" | "PIECE" | "BOITE" | "CAISSON" | "POUCE" | "METRE" | "METRE_CARRE" | "METRE_CUBE" | "METRE_LINEAIRE";
  prixUnitaire: number | null;
  description: string | null;
  clientId: string | null;
  produitId: string;
  depotId: string | null;
};

export default function ImportExcel() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState<string>("none");
  const [selectedProduitId, setSelectedProduitId] = useState<string>("");
  const [selectedDepotId, setSelectedDepotId] = useState<string>("none");
  const [parsedShipments, setParsedShipments] = useState<ParsedShipment[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [importResult, setImportResult] = useState<{
    success: boolean;
    imported: number;
    errors: Array<{ row: number; error: string }>;
    message: string;
  } | null>(null);
  
  const [clients, setClients] = useState<Array<{ id: string; name?: string; company?: string }>>([]);
  const [depots, setDepots] = useState<Array<{ id: string; name: string }>>([]);
  const [produits, setProduits] = useState<Array<{ id: string; name: string; unit: string }>>([]);
  const [loadingData, setLoadingData] = useState(true);

  const { executeAsync: executeDepots } = useAction(listDepots);
  const { executeAsync: executeProduits } = useAction(listProducts);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Charger les données de référence
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoadingData(true);
        
        // Charger les clients
        const clientsResult = await getClients();
        if (!isMounted) return;
        const mappedClients = (clientsResult || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          company: c.company,
        }));
        setClients(mappedClients);

        // Charger les dépôts
        const depotsResult = await executeDepots();
        if (!isMounted) return;
        const depotsData = depotsResult?.data?.data ?? [];
        setDepots(depotsData.map((d: any) => ({ id: d.id, name: d.name })));

        // Charger les produits
        const produitsResult = await executeProduits();
        if (!isMounted) return;
        const produitsData = produitsResult?.data?.data ?? [];
        setProduits(produitsData.map((p: any) => ({ id: p.id, name: p.name, unit: p.unit })));
      } catch (error) {
        if (!isMounted) return;
        console.error("Erreur lors du chargement des données:", error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les données"
        });
      } finally {
        if (isMounted) {
          setLoadingData(false);
        }
      }
    };

    if (open) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier l'extension du fichier
    const fileLowerName = file.name.toLowerCase();
    if (!fileLowerName.endsWith('.csv') && !fileLowerName.endsWith('.xlsx') && !fileLowerName.endsWith('.xls')) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner un fichier CSV ou Excel (.csv, .xlsx, .xls)"
      });
      return;
    }

    // Validation des sélections
    if (!selectedProduitId || selectedProduitId === '') {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez d'abord sélectionner un produit"
      });
      return;
    }

    setParsing(true);
    setProgress(0);

    try {
      // Lire le fichier
      const text = await file.text();
      setFileName(file.name);
      
      // Parser le CSV
      const lines = text.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));
      if (lines.length < 2) {
        throw new Error("Le fichier doit contenir au moins une ligne d'en-tête et une ligne de données");
      }

      // Parser les en-têtes
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Parser les données
      const data: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Parser la ligne en tenant compte des virgules dans les valeurs entre guillemets
        const values: string[] = [];
        let currentValue = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(currentValue.trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.trim()); // Dernière valeur

        if (values.length !== headers.length) {
          console.warn(`Ligne ${i + 1}: nombre de colonnes incorrect (${values.length} au lieu de ${headers.length})`);
          continue;
        }

        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }

      if (data.length === 0) {
        throw new Error("Aucune donnée valide trouvée dans le fichier");
      }

      setProgress(50);

      // Préparer les données pour l'import
      const shipmentsToImport: ParsedShipment[] = data.map((row, index) => {
        // Mapper les colonnes (sans client, produit, dépôt qui viennent de l'interface)
        const numerobl = row['Numéro BL'] || row['numero_bl'] || row['numerobl'] || '';
        const dateStr = row['Date (YYYY-MM-DD)'] || row['date'] || row['Date'] || '';
        const quantiteStr = row['Quantité'] || row['quantite'] || '0';
        const unite = row['Unité'] || row['unite'] || row['unit'] || 'L';
        const prixUnitaireStr = row['Prix Unitaire (optionnel)'] || row['prix_unitaire'] || row['prixUnitaire'] || '';
        const description = row['Description (optionnel)'] || row['description'] || '';

        // Validation
        if (!numerobl) {
          throw new Error(`Ligne ${index + 2}: Le numéro BL est requis`);
        }
        if (!dateStr) {
          throw new Error(`Ligne ${index + 2}: La date est requise`);
        }

        // Convertir les valeurs
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          throw new Error(`Ligne ${index + 2}: Date invalide: ${dateStr}`);
        }

        const quantite = parseFloat(quantiteStr.replace(',', '.'));
        if (isNaN(quantite) || quantite <= 0) {
          throw new Error(`Ligne ${index + 2}: Quantité invalide: ${quantiteStr}`);
        }

        // Valider et convertir l'unité
        const validUnites = ["KG", "G", "L", "ML", "TONNE", "PIECE", "BOITE", "CAISSON", "POUCE", "METRE", "METRE_CARRE", "METRE_CUBE", "METRE_LINEAIRE"] as const;
        const uniteUpper = unite.toUpperCase();
        if (!validUnites.includes(uniteUpper as any)) {
          throw new Error(`Ligne ${index + 2}: Unité invalide: ${unite}. Unités valides: ${validUnites.join(', ')}`);
        }
        const validUnite = uniteUpper as ParsedShipment['unite'];

        let prixUnitaire: number | null = null;
        if (prixUnitaireStr && prixUnitaireStr.trim() !== '') {
          const prix = parseFloat(prixUnitaireStr.replace(',', '.'));
          if (!isNaN(prix) && prix >= 0) {
            prixUnitaire = prix;
          }
        }

        return {
          numerobl,
          date,
          quantite,
          unite: validUnite,
          prixUnitaire,
          description: description || null,
          // Utiliser les valeurs sélectionnées dans l'interface
          clientId: selectedClientId && selectedClientId !== 'none' ? selectedClientId : null,
          produitId: selectedProduitId,
          depotId: selectedDepotId && selectedDepotId !== 'none' ? selectedDepotId : null,
        };
      });

      setParsedShipments(shipmentsToImport);
      setProgress(100);
      setImportResult(null); // Réinitialiser le résultat précédent
      
      toast({
        title: "Fichier analysé avec succès",
        description: `${shipmentsToImport.length} shipment(s) trouvé(s) et prêt(s) à être importé(s)`
      });
    } catch (error) {
      console.error("Erreur lors du parsing:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'analyse du fichier"
      });
      setParsedShipments([]);
      setFileName("");
    } finally {
      setParsing(false);
      setProgress(0);
    }
  };

  const handleValidateImport = async () => {
    if (parsedShipments.length === 0) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Aucune donnée à importer"
      });
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      setProgress(30);

      // Importer les données
      const result = await importShipments(parsedShipments);
      
      setProgress(80);

      if (!result?.data?.success) {
        throw new Error(result?.data?.failure || "Erreur lors de l'import");
      }

      const imported = result.data.success?.imported || 0;
      const errors = result.data.success?.errors || [];

      setProgress(100);

      // Stocker le résultat pour l'affichage
      if (errors.length > 0) {
        setImportResult({
          success: false,
          imported,
          errors,
          message: `Import partiel : ${imported} shipment(s) importé(s) avec succès, ${errors.length} erreur(s)`
        });
        toast({
          variant: "destructive",
          title: "Import partiel",
          description: `${imported} shipment(s) importé(s) avec succès. ${errors.length} erreur(s).`
        });
        console.error("Erreurs d'import:", errors);
      } else {
        setImportResult({
          success: true,
          imported,
          errors: [],
          message: `${imported} shipment(s) importé(s) avec succès ! Les mouvements de stock ont été effectués.`
        });
        toast({
          title: "Import réussi",
          description: `${imported} shipment(s) importé(s) avec succès ! Les mouvements de stock ont été effectués.`
        });
        
        // Réinitialiser et fermer après 3 secondes en cas de succès complet
        setTimeout(() => {
          setParsedShipments([]);
          setFileName("");
          setImportResult(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          setOpen(false);
          router.refresh();
        }, 3000);
      }
    } catch (error) {
      console.error("Erreur lors de l'import:", error);
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de l'import";
      setImportResult({
        success: false,
        imported: 0,
        errors: [{ row: 0, error: errorMessage }],
        message: `Échec de l'import : ${errorMessage}`
      });
      toast({
        variant: "destructive",
        title: "Échec de l'import",
        description: errorMessage
      });
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleReset = () => {
    setParsedShipments([]);
    setFileName("");
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Upload size={16} />
          Importer Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importer des shipments depuis Excel</DialogTitle>
          <DialogDescription>
            Sélectionnez d'abord le client, produit et dépôt, puis téléchargez le template, remplissez-le et importez-le.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Sélection des champs obligatoires */}
          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Chargement des données...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="import-client">Client (optionnel)</Label>
                <Select 
                  value={selectedClientId} 
                  onValueChange={setSelectedClientId}
                  disabled={loading || loadingData}
                >
                  <SelectTrigger id="import-client">
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun client</SelectItem>
                    {clients.length === 0 ? (
                      <SelectItem value="no-data" disabled>Aucun client disponible</SelectItem>
                    ) : (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name || client.company || "Sans nom"}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="import-produit">
                  Produit <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={selectedProduitId} 
                  onValueChange={setSelectedProduitId}
                  disabled={loading || loadingData}
                >
                  <SelectTrigger id="import-produit">
                    <SelectValue placeholder="Sélectionner un produit" />
                  </SelectTrigger>
                  <SelectContent>
                    {produits.length === 0 ? (
                      <SelectItem value="no-data" disabled>Aucun produit disponible</SelectItem>
                    ) : (
                      produits.map((produit) => (
                        <SelectItem key={produit.id} value={produit.id}>
                          {produit.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="import-depot">Dépôt (optionnel)</Label>
                <Select 
                  value={selectedDepotId} 
                  onValueChange={setSelectedDepotId}
                  disabled={loading || loadingData}
                >
                  <SelectTrigger id="import-depot">
                    <SelectValue placeholder="Sélectionner un dépôt" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun dépôt</SelectItem>
                    {depots.length === 0 ? (
                      <SelectItem value="no-data" disabled>Aucun dépôt disponible</SelectItem>
                    ) : (
                      depots.map((depot) => (
                        <SelectItem key={depot.id} value={depot.id}>
                          {depot.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Upload du fichier */}
          <div>
            <Label htmlFor="file-upload">Fichier CSV ou Excel</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={loading || loadingData || parsing || !selectedProduitId}
            />
            <label htmlFor="file-upload">
              <Button
                type="button"
                variant="outline"
                className="w-full mt-2"
                disabled={loading || loadingData || parsing || !selectedProduitId}
                onClick={() => fileInputRef.current?.click()}
              >
                {parsing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {fileName ? `Fichier: ${fileName}` : "Sélectionner un fichier CSV ou Excel"}
                  </>
                )}
              </Button>
            </label>
            {!selectedProduitId && (
              <p className="text-sm text-muted-foreground mt-1">
                Veuillez d'abord sélectionner un produit
              </p>
            )}
            {parsing && (
              <div className="space-y-2 mt-2">
                <Progress value={progress} />
                <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyse du fichier en cours...
                </p>
              </div>
            )}
            {fileName && !parsing && parsedShipments.length === 0 && (
              <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Fichier sélectionné mais aucune donnée valide trouvée. Vérifiez le format du fichier.
                </p>
              </div>
            )}
          </div>

          {/* Aperçu des données parsées */}
          {parsedShipments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Aperçu des données à importer ({parsedShipments.length} shipment(s))
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Numéro BL</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Unité</TableHead>
                        <TableHead>Prix Unitaire</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedShipments.slice(0, 10).map((shipment, index) => (
                        <TableRow key={index}>
                          <TableCell>{shipment.numerobl}</TableCell>
                          <TableCell>{shipment.date.toLocaleDateString('fr-FR')}</TableCell>
                          <TableCell>{shipment.quantite}</TableCell>
                          <TableCell>{shipment.unite}</TableCell>
                          <TableCell>
                            {shipment.prixUnitaire 
                              ? `${shipment.prixUnitaire.toFixed(2).replace('.', ',')}` 
                              : '-'}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {shipment.description || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {parsedShipments.length > 10 && (
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      ... et {parsedShipments.length - 10} autre(s) ligne(s)
                    </p>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    disabled={loading}
                    className="flex-1"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Réinitialiser
                  </Button>
                  <Button
                    onClick={handleValidateImport}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Import en cours...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Valider et Importer
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">
                {progress < 30 && "Préparation de l'import..."}
                {progress >= 30 && progress < 80 && "Import en cours..."}
                {progress >= 80 && progress < 100 && "Mise à jour du stock..."}
                {progress === 100 && "Import terminé !"}
              </p>
            </div>
          )}

          {/* Résultat de l'import */}
          {importResult && !loading && (
            <Card className={importResult.success ? "border-green-500" : "border-red-500"}>
              <CardHeader>
                <CardTitle className={`text-lg flex items-center gap-2 ${
                  importResult.success ? "text-green-600" : "text-red-600"
                }`}>
                  {importResult.success ? (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      Import réussi
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5" />
                      Import échoué ou partiel
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  importResult.success 
                    ? "bg-green-50 dark:bg-green-950" 
                    : "bg-red-50 dark:bg-red-950"
                }`}>
                  <p className={`font-medium ${
                    importResult.success ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"
                  }`}>
                    {importResult.message}
                  </p>
                </div>

                {importResult.success ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Tous les shipments ont été importés et le stock a été mis à jour.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {importResult.imported > 0 && (
                      <div className="flex items-center gap-2 text-sm text-amber-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>{importResult.imported} shipment(s) importé(s) avec succès</span>
                      </div>
                    )}
                    {importResult.errors.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-red-600">
                          Erreurs rencontrées ({importResult.errors.length}) :
                        </p>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {importResult.errors.map((error, index) => (
                            <div key={index} className="text-xs p-2 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
                              <span className="font-medium">Ligne {error.row}:</span> {error.error}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="flex-1"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Réinitialiser
                  </Button>
                  {importResult.success && (
                    <Button
                      onClick={() => {
                        handleReset();
                        setOpen(false);
                        router.refresh();
                      }}
                      className="flex-1"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Fermer
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              handleReset();
              setOpen(false);
            }} 
            disabled={loading}
          >
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

