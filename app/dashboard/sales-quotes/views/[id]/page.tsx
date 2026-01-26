import Link from "next/link";
import { getQuoteById } from "../../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type QuoteWithRelations = {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  proformaNumber?: string | null;
  description?: string | null;
  tvaApplicable?: boolean | null;
  tvaAmount?: number | null;
  baseDDUUSD?: number | null;
  baseDDPUSD?: number | null;
  marginUSD?: number | null;
  freightToMineUSD?: number | null;
  totalDDUUSD?: number | null;
  totalDDPUSD?: number | null;
  client?: { name?: string | null } | null;
  user?: { name?: string | null } | null;
};

export default async function ViewSalesQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const response = await getQuoteById({ id });

  if (!response?.data?.success || !response.data.result) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Devis introuvable.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/sales-quotes">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  const quote = response.data.result as QuoteWithRelations;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/sales-quotes">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <FileText className="h-8 w-8 text-primary" />
                Détails du Devis: {quote.proformaNumber || quote.id}
              </h1>
              <p className="text-muted-foreground">Visualisation complète du devis commercial</p>
            </div>
          </div>
          <Link href={`/dashboard/sales-quotes/${quote.id}`}>
            <Button size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations Générales</CardTitle>
          <CardDescription>Détails du devis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">N° Proforma</Label>
              <p className="text-lg font-semibold">{quote.proformaNumber || "N/A"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Client</Label>
              <p className="text-lg">{quote.client?.name || "N/A"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Auteur</Label>
              <p className="text-lg">{quote.user?.name || "N/A"}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">TVA Applicable</Label>
              <div className="mt-2">
                <Badge variant={quote.tvaApplicable ? "default" : "secondary"}>
                  {quote.tvaApplicable ? "Oui" : "Non"}
                </Badge>
              </div>
            </div>
          </div>
          {quote.description && (
            <div className="mt-4">
              <Label className="text-sm font-medium text-muted-foreground">Description</Label>
              <p className="text-sm text-gray-600 mt-2">{quote.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tarification</CardTitle>
          <CardDescription>Détails des prix</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Base DDU (USD)</Label>
              <p className="text-2xl font-bold text-primary">
                ${(quote.baseDDUUSD || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Base DDP (USD)</Label>
              <p className="text-2xl font-bold text-primary">
                ${(quote.baseDDPUSD || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Marge (USD)</Label>
              <p className="text-xl font-semibold">
                ${(quote.marginUSD || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Fret vers Mine (USD)</Label>
              <p className="text-xl font-semibold">
                ${(quote.freightToMineUSD || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Total DDU (USD)</Label>
              <p className="text-2xl font-bold text-green-600">
                ${(quote.totalDDUUSD || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Total DDP (USD)</Label>
              <p className="text-2xl font-bold text-green-600">
                ${(quote.totalDDPUSD || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            {quote.tvaAmount && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Montant TVA</Label>
                <p className="text-xl font-semibold">
                  ${(quote.tvaAmount || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informations Système</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Date de création</Label>
              <p className="text-sm text-gray-600">
                {new Date(quote.createdAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Dernière mise à jour</Label>
              <p className="text-sm text-gray-600">
                {new Date(quote.updatedAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
