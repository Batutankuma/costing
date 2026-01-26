import { findAllDGIFacturesAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import { Plus, FileText, Eye } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function DGIFactureListPage() {
    const res = await findAllDGIFacturesAction();
    const factures = (res?.data as any)?.result || [];

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Factures Normalisées DGI</h1>
                    <p className="text-muted-foreground">Gérez vos factures conformes à la réglementation DGI.</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/crm/facture-dgi/create">
                        <Plus className="mr-2 h-4 w-4" /> Nouvelle Facture
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableCaption>Liste des factures enregistrées.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Numéro</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Client</TableHead>
                            <TableHead>NIF Client</TableHead>
                            <TableHead className="text-right">Montant TTC</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {factures.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <FileText className="h-8 w-8 text-muted-foreground/50" />
                                        <p>Aucune facture trouvée.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            factures.map((facture: any) => (
                                <TableRow key={facture.id}>
                                    <TableCell className="font-medium">{facture.invoiceNumber}</TableCell>
                                    <TableCell>{format(new Date(facture.invoiceDate), "dd MMM yyyy", { locale: fr })}</TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={facture.clientName}>{facture.clientName}</TableCell>
                                    <TableCell>{facture.clientNif || "-"}</TableCell>
                                    <TableCell className="text-right font-mono">
                                        {facture.totalTTC.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {facture.currency}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/dashboard/crm/facture-dgi/${facture.id}`}>
                                                <Eye className="h-4 w-4" />
                                                <span className="sr-only">Voir</span>
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
