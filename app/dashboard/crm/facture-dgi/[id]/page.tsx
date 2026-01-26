import { getDGIFactureById } from "../actions";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import PrintButton from "./client-print-button";

interface DGIFactureDetailsPageProps {
    params: Promise<{ id: string }>;
}

export default async function DGIFactureDetailsPage({ params }: DGIFactureDetailsPageProps) {
    const { id } = await params;
    const invoice = await getDGIFactureById(id);

    if (!invoice) {
        notFound();
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6 pb-24 print:p-0 print:max-w-none">
            {/* Header Actions (Hidden in Print) */}
            <div className="flex items-center justify-between print:hidden">
                <Button variant="ghost" asChild>
                    <Link href="/dashboard/crm/facture-dgi">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Retour a la liste
                    </Link>
                </Button>
                <PrintButton />
            </div>

            {/* Invoice Layout */}
            <div className="bg-white p-8 shadow-sm border rounded-lg space-y-8 print:shadow-none print:border-none print:rounded-none">

                {/* Header Logic: Vendor & Invoice Info */}
                <div className="flex justify-between items-start border-b pb-6">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold uppercase">{invoice.vendorName}</h2>
                        <p className="text-sm text-muted-foreground">NIF: {invoice.vendorNif}</p>
                        <p className="text-sm text-muted-foreground">RCCM: -</p>
                        <p className="text-sm text-muted-foreground">Adresse: -</p>
                    </div>
                    <div className="text-right space-y-1">
                        <h1 className="text-2xl font-bold text-primary">FACTURE</h1>
                        <p className="text-lg font-mono">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-muted-foreground">
                            Date: {format(new Date(invoice.invoiceDate), "dd MMM yyyy", { locale: fr })}
                        </p>
                    </div>
                </div>

                {/* Client Info */}
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900 border-b pb-1">Facturer à</h3>
                        <p className="font-bold">{invoice.clientName}</p>
                        {invoice.clientAddress && <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.clientAddress}</p>}
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between border-b border-dashed py-1">
                            <span className="text-muted-foreground">NIF Client:</span>
                            <span className="font-medium">{invoice.clientNif || "N/A"}</span>
                        </div>
                        <div className="flex justify-between border-b border-dashed py-1">
                            <span className="text-muted-foreground">RCCM Client:</span>
                            <span className="font-medium">{invoice.clientRccm || "N/A"}</span>
                        </div>
                        <div className="flex justify-between border-b border-dashed py-1">
                            <span className="text-muted-foreground">Devise:</span>
                            <span className="font-medium">{invoice.currency}</span>
                        </div>
                    </div>
                </div>

                {/* Lines Table */}
                <div className="rounded-md border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-900 font-semibold">
                            <tr>
                                <th className="px-4 py-3 text-left">Description</th>
                                <th className="px-4 py-3 text-right">Qté</th>
                                <th className="px-4 py-3 text-right">P.U.</th>
                                <th className="px-4 py-3 text-right">TVA %</th>
                                <th className="px-4 py-3 text-right">Total HT</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {invoice.lines.map((line: any) => (
                                <tr key={line.id}>
                                    <td className="px-4 py-3">{line.description}</td>
                                    <td className="px-4 py-3 text-right">{line.quantity}</td>
                                    <td className="px-4 py-3 text-right">{line.unitPrice.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right">{line.tvaRate}%</td>
                                    <td className="px-4 py-3 text-right font-medium">{line.totalHT.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end pt-4">
                    <div className="w-64 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total HT:</span>
                            <span className="font-medium">{invoice.totalHT.toLocaleString()} {invoice.currency}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total TVA:</span>
                            <span className="font-medium">{invoice.totalTVA.toLocaleString()} {invoice.currency}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t border-gray-900 pt-2">
                            <span>Net à Payer:</span>
                            <span>{invoice.totalTTC.toLocaleString()} {invoice.currency}</span>
                        </div>
                    </div>
                </div>

                {/* DGI Footer Placeholder */}
                <div className="border-t-2 border-dashed pt-6 mt-12 text-center text-xs space-y-2">
                    <div className="flex justify-center items-center gap-4">
                        <div className="border p-2 rounded bg-gray-50 text-gray-400 w-24 h-24 flex items-center justify-center">
                            QR CODE (Placeholder)
                        </div>
                        <div className="text-left space-y-1">
                            <p><strong>Code MECeF/DGI:</strong> {invoice.dgiMeccef || "--------------------------------"}</p>
                            <p><strong>NIM:</strong> {invoice.dgiNim || "----------------"}</p>
                            <p><strong>Compteur:</strong> {invoice.invoiceNumber || "N/A"}</p>
                            <p><strong>Date Signature:</strong> {invoice.createdAt.toISOString()}</p>
                        </div>
                    </div>
                    <p className="text-muted-foreground italic mt-4">
                        "Les biens vendus ne sont ni repris ni échangés."
                    </p>
                </div>

            </div>
        </div>
    );
}
