"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function DownloadTemplate() {
  const downloadTemplate = () => {
    // Créer le contenu CSV avec les en-têtes et des exemples
    // Note: Client, Produit et Dépôt sont sélectionnés dans l'interface, pas dans le fichier
    const headers = [
      "Numéro BL",
      "Date (YYYY-MM-DD)",
      "Quantité",
      "Unité",
      "Prix Unitaire (optionnel)",
      "Description (optionnel)"
    ];

    const example1 = [
      "BL-2024-001",
      "2024-01-15",
      "100.50",
      "L",
      "1,50",
      "Livraison client ABC"
    ];

    const example2 = [
      "BL-2024-002",
      "2024-01-16",
      "250.00",
      "KG",
      "2,75",
      ""
    ];

    const csvContent = [
      headers.join(","),
      example1.join(","),
      example2.join(","),
      "",
      "# INSTRUCTIONS:",
      "# 1. Les champs Client, Produit et Dépôt seront sélectionnés dans l'interface avant l'import",
      "# 2. Les dates doivent être au format YYYY-MM-DD (ex: 2024-01-15)",
      "# 3. Les prix peuvent utiliser une virgule comme séparateur décimal (ex: 1,50)",
      "# 4. Unités possibles: KG, G, L, ML, TONNE, PIECE, BOITE, CAISSON, POUCE, METRE, METRE_CARRE, METRE_CUBE, METRE_LINEAIRE",
      "# 5. Supprimez les lignes d'instructions (commençant par #) avant l'import"
    ].join("\n");

    // Créer et télécharger le fichier
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "template_shipments.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button
      variant="outline"
      onClick={downloadTemplate}
      className="flex items-center gap-2"
    >
      <Download size={16} />
      Télécharger le template
    </Button>
  );
}

