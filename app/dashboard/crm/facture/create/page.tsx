"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { CreateManualFactureSchema } from "@/models/mvc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAction } from "next-safe-action/hooks";
import {
  createFactureAction,
  getAutoFactureFromCommandeAction,
  getNextInvoiceNumberAction,
  listCommandeReferencesAction,
} from "../actions";
import { Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState, useMemo } from "react";
import QRCode from "react-qr-code";

const FormSchema = CreateManualFactureSchema.omit({
  dueInDays: true,
  currency: true,
  taxRate: true,
  otherFees: true,
}).extend({
  invoiceDate: z.date({ required_error: "Date requise" }),
  currency: z.string().min(1, "Devise requise"),
  dueInDays: z.number().min(0, "Échéance invalide"),
  taxRate: z.number().min(0, "TVA invalide").max(100, "TVA invalide"),
  otherFees: z.number().min(0, "Frais invalides"),
});

type FormData = z.infer<typeof FormSchema>;

// Informations de la société (codées en dur)
const COMPANY_INFO = {
  name: "AAGS Petrole et Gaz",
  fullName: "AAGS PETROLE ET GAZ SARLU",
  address: "Immeuble CTC, Av Wagenya n°8778, 5ème étage, App 501, Kinshasa/Gombe",
  taxNumber: "A2441781R",
  rccm: "CD/KNG/RCCM/24-B-04493",
  idNat: "01-B0500-N55496H",
  phone1: "+243 99 26 96 253",
  phone2: "+243 808 472 427",
  email: "info@aagspg.com",
  slogan: "L'Energie qui propulse votre entreprise.",
  bankAccounts: {
    bofiCdf: "00031-26100-40044491012-71",
    bofiUsd: "00031-26110-40044491011-21",
    rawBankCdf: "05100-05101-01125487002-44",
    rawBankUsd: "05100-05101-01125487001-47",
    boaUsd: "00029-01017-03103860005-84",
  },
  siegeSocial: "Immeuble CTC, Avenue Wagenia nº 8778, 5ème étage, Appt 501. Kinshasa/Gombe, République Démocratique du Congo",
  siegeExploitation: "Aéroport de Kalemie Province de Tanganyika",
};

type Client = {
  id: string;
  name: string;
  company?: string | null;
  address?: string | null;
  rccm?: string | null;
  idNat?: string | null;
  nif?: string | null;
};

export default function CreateFacturePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { executeAsync, status } = useAction(createFactureAction);
  const { executeAsync: getNextInvoiceNumber } = useAction(getNextInvoiceNumberAction);
  const { executeAsync: listCommandeReferences } = useAction(listCommandeReferencesAction);
  const { executeAsync: getAutoFactureFromCommande, status: autoLoadStatus } = useAction(getAutoFactureFromCommandeAction);
  const [clients, setClients] = useState<Client[]>([]);
  const [commandeRefs, setCommandeRefs] = useState<string[]>([]);
  const [billingMode, setBillingMode] = useState<"manual" | "auto">("manual");
  const [selectedCommandeRef, setSelectedCommandeRef] = useState<string>("");
  const [clientId, setClientId] = useState<string>("");
  const [printMode, setPrintMode] = useState<boolean>(false);
  const [deliveryNotes, setDeliveryNotes] = useState<string[]>([""]);

  const form = useForm<FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      invoiceNumber: "",
      invoiceDate: new Date(),
      vendorName: COMPANY_INFO.name,
      vendorAddress: COMPANY_INFO.address,
      vendorTaxNumber: COMPANY_INFO.taxNumber,
      clientName: "",
      clientAddress: "",
      clientTaxNumber: "",
      purchaseOrder: "",
      dueInDays: 7,
      currency: "USD",
      notes: "Nous vous remercions de votre confiance.",
      taxRate: 0,
      otherFees: 0,
      lines: [
        {
          description: "",
          unit: "Litre",
          quantity: 1,
          unitPrice: 0,
        },
      ],
    },
  });

  // Charger la liste des clients
  useEffect(() => {
    (async () => {
      try {
        const [clientsResponse, commandesResponse] = await Promise.all([
          fetch("/api/clients", { cache: "no-store" }),
          listCommandeReferences(),
        ]);
        if (clientsResponse.ok) {
          const data = await clientsResponse.json();
          setClients(Array.isArray(data) ? data : []);
        }
        const refs = commandesResponse?.data?.success;
        if (Array.isArray(refs)) {
          setCommandeRefs(
            refs
              .map((item) => String(item.reference || "").trim())
              .filter(Boolean),
          );
        }
      } catch {
        setClients([]);
        setCommandeRefs([]);
      }
    })();
  }, [listCommandeReferences]);

  // Générer le numéro de facture automatiquement (X-MM/YY, ex: 1-12/25)
  useEffect(() => {
    (async () => {
      const currentNumber = form.watch("invoiceNumber");
      if (currentNumber) return;
      try {
        const result = await getNextInvoiceNumber();
        const nextNumber = result?.data?.success as string | undefined;
        if (nextNumber) {
          form.setValue("invoiceNumber", nextNumber);
        }
      } catch {
        const mm = new Date().toLocaleDateString("fr-FR", { month: "2-digit" }).slice(0, 2);
        const yy = new Date().toLocaleDateString("fr-FR", { year: "2-digit" });
        form.setValue("invoiceNumber", `1-${mm}/${yy}`);
      }
    })();
  }, [form, getNextInvoiceNumber]);

  // Synchroniser deliveryNotes avec les lignes
  useEffect(() => {
    const linesCount = form.watch("lines").length;
    if (deliveryNotes.length < linesCount) {
      setDeliveryNotes([...deliveryNotes, ...Array(linesCount - deliveryNotes.length).fill("")]);
    } else if (deliveryNotes.length > linesCount) {
      setDeliveryNotes(deliveryNotes.slice(0, linesCount));
    }
  }, [form.watch("lines").length]);

  // Remplir les informations du client lors de la sélection
  useEffect(() => {
    if (clientId) {
      const client = clients.find((c) => c.id === clientId);
      if (client) {
        form.setValue("clientName", client.name || "");
        form.setValue("clientAddress", client.address || "");
        // Utiliser nif comme clientTaxNumber si disponible
        form.setValue("clientTaxNumber", client.nif || "");
      }
    } else {
      form.setValue("clientName", "");
      form.setValue("clientAddress", "");
      form.setValue("clientTaxNumber", "");
    }
  }, [clientId, clients, form]);

  const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: "lines" });

  const totals = form.watch("lines").reduce(
    (acc, line) => {
      const total = Number(line.quantity || 0) * Number(line.unitPrice || 0);
      return { ...acc, subtotal: acc.subtotal + total };
    },
    { subtotal: 0 },
  );

  const taxRate = form.watch("taxRate") ?? 0;
  const otherFees = form.watch("otherFees") ?? 0;
  const taxAmount = (totals.subtotal * taxRate) / 100;
  const grandTotal = totals.subtotal + taxAmount + otherFees;

  const selectedClient = clients.find((c) => c.id === clientId);

  // Fonction pour convertir le montant en lettres (français)
  const numberToWordsFR = (n: number): string => {
    const units = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize"];
    const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];
    const underHundred = (num: number): string => {
      if (num < 17) return units[num];
      if (num < 20) return "dix-" + units[num - 10];
      if (num < 70) {
        const d = Math.floor(num / 10),
          u = num % 10;
        if (u === 0) return tens[d];
        if (u === 1 && (d === 2 || d === 3 || d === 4 || d === 5)) return tens[d] + " et un";
        return tens[d] + "-" + units[u];
      }
      if (num < 80) return "soixante-" + underHundred(num - 60);
      if (num === 80) return "quatre-vingts";
      return "quatre-vingt-" + underHundred(num - 80);
    };
    const underThousand = (num: number): string => {
      if (num < 100) return underHundred(num);
      const h = Math.floor(num / 100),
        r = num % 100;
      if (h === 1) return "cent" + (r ? " " + underHundred(r) : "");
      return units[h] + " cent" + (r ? " " + underHundred(r) : "s");
    };
    const scale = (num: number, base: number, labelSing: string, labelPl: string) => {
      const q = Math.floor(num / base),
        r = num % base;
      if (!q) return { head: "", rest: r };
      const lbl = q > 1 ? labelPl : labelSing;
      return { head: (q === 1 && base === 1000 ? "mille" : numberToWordsFR(q) + " " + lbl), rest: r };
    };
    if (n === 0) return units[0];
    const parts: string[] = [];
    let rest = n;
    const milliards = scale(rest, 1_000_000_000, "milliard", "milliards");
    if (milliards.head) parts.push(milliards.head);
    rest = milliards.rest;
    const millions = scale(rest, 1_000_000, "million", "millions");
    if (millions.head) parts.push(millions.head);
    rest = millions.rest;
    const milliers = scale(rest, 1000, "mille", "mille");
    if (milliers.head) parts.push(milliers.head);
    rest = milliers.rest;
    if (rest) parts.push(underThousand(rest));
    return parts.join(" ").replace(/\s+/g, " ").trim();
  };

  const amountToWordsFR = (value: number): string => {
    const dollars = Math.floor(value);
    const cents = Math.round((value - dollars) * 100);
    const dStr = numberToWordsFR(Math.abs(dollars));
    const cStr = numberToWordsFR(Math.abs(cents));
    const sign = value < 0 ? "moins " : "";
    const currency = form.watch("currency") === "USD" ? "dollars américains" : form.watch("currency");
    return `${sign}${dStr} ${currency}${cents ? " et " + cStr + " cents" : ""}`;
  };

  const loadAutomaticFromCommande = async () => {
    if (!selectedCommandeRef) {
      toast({ variant: "destructive", title: "Bon de commande requis", description: "Sélectionnez un bon de commande." });
      return;
    }
    const result = await getAutoFactureFromCommande({ reference: selectedCommandeRef });
    if (!result?.data?.success) {
      toast({
        variant: "destructive",
        title: "Chargement automatique impossible",
        description: result?.data?.failure || "Aucune livraison liée à ce bon de commande.",
      });
      return;
    }

    const autoData = result.data.success;
    replace(
      autoData.lines.map((line) => ({
        description: line.description || "",
        unit: line.unit || "Litre",
        quantity: Number(line.quantity || 0),
        unitPrice: Number(line.unitPrice || 0),
      })),
    );
    setDeliveryNotes(autoData.lines.map((line) => line.dn || ""));
    form.setValue("purchaseOrder", autoData.purchaseOrder);

    if (autoData.client) {
      setClientId(autoData.client.id);
      form.setValue("clientName", autoData.client.name || "");
      form.setValue("clientAddress", autoData.client.address || "");
      form.setValue("clientTaxNumber", autoData.client.taxNumber || "");
    }

    toast({
      title: "Facture automatique prête",
      description: `${autoData.lines.length} livraison(s) ajoutée(s) à la facture.`,
    });
  };

  const onSubmit = async (data: FormData) => {
    const result = await executeAsync(data);
    if (result?.data?.success) {
      toast({ title: "Facture créée", description: "La facture a été enregistrée." });
      if (printMode) {
        setTimeout(() => {
          triggerPrint();
        }, 500);
      } else {
        router.push("/dashboard/crm/facture");
      }
    } else {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: result?.data?.failure || "Une erreur est survenue",
      });
    }
  };

  const onSaveAndPrint = async () => {
    setPrintMode(true);
    const isValid = await form.trigger();
    if (isValid) {
      const data = form.getValues();
      await onSubmit(data);
    }
  };

  const triggerPrint = () => {
    document.body.classList.add("print-facture");
    setTimeout(() => {
      window.print();
      setTimeout(() => document.body.classList.remove("print-facture"), 100);
    }, 150);
  };

  const isSubmitting = status === "executing";

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6 pb-24 px-4 md:px-0">
      <div>
        <h1 className="text-2xl font-semibold">Nouvelle facture</h1>
        <p className="text-sm text-muted-foreground">Créer une facture manuelle</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Client *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  const name = prompt("Nom du client");
                  if (!name) return;
                  try {
                    const r = await fetch("/api/clients", {
                      method: "POST",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ name }),
                    });
                    if (r.ok) {
                      const created = await r.json();
                      setClients((prev) => [{ id: created.id, name: created.name }, ...prev]);
                      setClientId(created.id);
                    }
                  } catch (e) {
                    toast({ variant: "destructive", title: "Erreur", description: "Impossible de créer le client" });
                  }
                }}
              >
                Ajouter un client
              </Button>
            </div>
            <Select value={clientId} onValueChange={(v) => setClientId(v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!clientId && form.formState.errors.clientName && (
              <p className="text-sm text-destructive">Veuillez sélectionner un client</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mode de facturation</Label>
              <Select value={billingMode} onValueChange={(value: "manual" | "auto") => setBillingMode(value)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Sélectionner le mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manuelle</SelectItem>
                  <SelectItem value="auto">Automatique depuis bon de commande</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {billingMode === "auto" ? (
              <div className="space-y-2">
                <Label>Bon de commande</Label>
                <div className="flex gap-2">
                  <Select value={selectedCommandeRef} onValueChange={setSelectedCommandeRef}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Choisir un numéro de commande" />
                    </SelectTrigger>
                    <SelectContent>
                      {commandeRefs.map((ref) => (
                        <SelectItem key={ref} value={ref}>
                          {ref}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={loadAutomaticFromCommande}
                    disabled={autoLoadStatus === "executing"}
                  >
                    Charger
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Le système ajoute automatiquement toutes les livraisons liées au bon de commande.
                </p>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Numéro de facture *</Label>
              <Input id="invoiceNumber" {...form.register("invoiceNumber")} />
              {form.formState.errors.invoiceNumber && (
                <p className="text-sm text-destructive">{form.formState.errors.invoiceNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceDate">Date *</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={format(form.watch("invoiceDate"), "yyyy-MM-dd")}
                onChange={(event) => form.setValue("invoiceDate", new Date(event.target.value))}
              />
              {form.formState.errors.invoiceDate && (
                <p className="text-sm text-destructive">{form.formState.errors.invoiceDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseOrder">Bon de commande</Label>
              <Input id="purchaseOrder" {...form.register("purchaseOrder")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueInDays">Échéance (jours)</Label>
              <Input id="dueInDays" type="number" {...form.register("dueInDays", { valueAsNumber: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Devise</Label>
              <Input id="currency" {...form.register("currency")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="taxRate">TVA (%)</Label>
              <Input id="taxRate" type="number" step="0.01" {...form.register("taxRate", { valueAsNumber: true })} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherFees">Autres frais</Label>
              <Input id="otherFees" type="number" step="0.01" {...form.register("otherFees", { valueAsNumber: true })} />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lignes de facturation</CardTitle>
              <CardDescription>Ajoutez les produits ou services facturés.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-6 gap-4 border p-4 rounded-lg">
                  <div className="space-y-2">
                    <Label>DN (Bon de livraison)</Label>
                    <Input
                      value={deliveryNotes[index] || ""}
                      onChange={(e) => {
                        const newNotes = [...deliveryNotes];
                        newNotes[index] = e.target.value;
                        setDeliveryNotes(newNotes);
                      }}
                      placeholder="DN 7301"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Produit/Description *</Label>
                    <Input {...form.register(`lines.${index}.description` as const)} />
                    {form.formState.errors.lines?.[index]?.description && (
                      <p className="text-sm text-destructive">{form.formState.errors.lines?.[index]?.description?.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Unité *</Label>
                    <Input {...form.register(`lines.${index}.unit` as const)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantité *</Label>
                    <Input type="number" step="0.01" {...form.register(`lines.${index}.quantity` as const, { valueAsNumber: true })} />
                  </div>
                  <div className="space-y-2">
                    <Label>P.U Hors TVA *</Label>
                    <Input type="number" step="0.0001" {...form.register(`lines.${index}.unitPrice` as const, { valueAsNumber: true })} />
                  </div>
                  <div className="md:col-span-6 flex justify-end">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          remove(index);
                          const newNotes = [...deliveryNotes];
                          newNotes.splice(index, 1);
                          setDeliveryNotes(newNotes);
                        }}
                        className="gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        Retirer
                      </Button>
                    )}
                  </div>
                </div>
              ))}

            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => {
                append({ description: "", unit: "Litre", quantity: 1, unitPrice: 0 });
                setDeliveryNotes([...deliveryNotes, ""]);
              }}
            >
              <Plus className="h-4 w-4" /> Ajouter une ligne
            </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea rows={3} {...form.register("notes")} />
            </div>
            <div className="space-y-2 bg-muted/40 rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span>Sous-total</span>
                <span>
                  {totals.subtotal.toFixed(2)} {form.watch("currency")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>TVA ({taxRate}%)</span>
                <span>
                  {taxAmount.toFixed(2)} {form.watch("currency")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Autres</span>
                <span>
                  {otherFees.toFixed(2)} {form.watch("currency")}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Total TTC</span>
                <span>
                  {grandTotal.toFixed(2)} {form.watch("currency")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="button" variant="secondary" onClick={onSaveAndPrint} disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : "Enregistrer et imprimer"}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>

      {/* Styles pour l'impression */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          body {
            background: #fff !important;
            margin: 0;
            padding: 0;
          }
          body * {
            visibility: hidden !important;
          }
          body.print-facture .facture-print,
          body.print-facture .facture-print * {
            visibility: visible !important;
          }
          .facture-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            min-height: 100vh;
            padding: 15mm 20mm;
            font-family: Arial, sans-serif;
            background: white;
            box-sizing: border-box;
          }
          .no-print {
            display: none !important;
          }
        }
        @media screen {
          .facture-print {
            display: none;
          }
          body.print-facture .facture-print {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 9999;
            background: white;
            overflow: auto;
            padding: 20px;
          }
        }
      `}</style>

      {/* PDF FACTURE - Modèle exact */}
      <div className="facture-print" style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", lineHeight: "1.4", color: "#000", width: "100%", padding: "0", boxSizing: "border-box" }}>
        {/* En-tête avec image */}
        <div style={{ width: "100%", marginBottom: "20px" }}>
          <Image src="/assets/tete.png" alt="En-tête AAGS" width={800} height={200} style={{ width: "100%", height: "auto", display: "block" }} />
        </div>

        {/* Contenu principal avec padding */}
        <div style={{ padding: "0 20mm 15mm 20mm" }}>

        {/* Informations société */}
        <div style={{ marginBottom: "15px", fontSize: "11px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "2px" }}>{COMPANY_INFO.name}</div>
          <div>Adresse: {COMPANY_INFO.address}</div>
          <div>N° Impôt : {COMPANY_INFO.taxNumber}</div>
        </div>

        {/* Numéro facture et date - même ligne */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ fontSize: "16px", fontWeight: "bold" }}>N° FACTURE {form.watch("invoiceNumber") || "01-25/15"}</div>
          <div style={{ fontSize: "11px" }}>Kinshasa {format(form.watch("invoiceDate"), "dd MMMM yyyy", { locale: fr })}</div>
        </div>

        {/* Section FACTURER À - Deux colonnes */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "20px" }}>
          <div>
            <div style={{ fontWeight: "bold", marginBottom: "8px", fontSize: "12px" }}>FACTURER À :</div>
            <div style={{ fontSize: "10px", lineHeight: "1.6" }}>
              <div><span style={{ fontWeight: "bold" }}>Nom de la société</span> : {form.watch("clientName") || ""}</div>
              <div><span style={{ fontWeight: "bold" }}>Adresse</span> : {form.watch("clientAddress") || ""}</div>
              <div><span style={{ fontWeight: "bold" }}>N° Impôt</span> : {form.watch("clientTaxNumber") || ""}</div>
              {selectedClient?.idNat && <div><span style={{ fontWeight: "bold" }}>Id Nat</span> : {selectedClient.idNat}</div>}
              {form.watch("purchaseOrder") && <div><span style={{ fontWeight: "bold" }}>Bon de Commande</span> : {form.watch("purchaseOrder")}</div>}
            </div>
          </div>
          <div style={{ fontSize: "10px" }}>
            <div style={{ marginBottom: "4px" }}><span style={{ fontWeight: "bold" }}>Échéance:</span> {form.watch("dueInDays")} jours</div>
          </div>
        </div>

        {/* Tableau des lignes */}
        <table style={{ width: "100%", fontSize: "10px", marginBottom: "15px", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5" }}>
              <th style={{ padding: "8px", textAlign: "center", border: "1px solid #333", fontWeight: "bold" }}>#</th>
              <th style={{ padding: "8px", textAlign: "left", border: "1px solid #333", fontWeight: "bold" }}>PRODUIT</th>
              <th style={{ padding: "8px", textAlign: "center", border: "1px solid #333", fontWeight: "bold" }}>UNITÉ</th>
              <th style={{ padding: "8px", textAlign: "center", border: "1px solid #333", fontWeight: "bold" }}>QTY</th>
              <th style={{ padding: "8px", textAlign: "center", border: "1px solid #333", fontWeight: "bold" }}>P.U Hors TVA</th>
              <th style={{ padding: "8px", textAlign: "right", border: "1px solid #333", fontWeight: "bold" }}>PRIX TOTAL (USD)</th>
            </tr>
          </thead>
          <tbody>
            {form.watch("lines").map((line, index) => {
              const lineTotal = Number(line.quantity || 0) * Number(line.unitPrice || 0);
              return (
                <tr key={index}>
                  <td style={{ padding: "8px", textAlign: "center", border: "1px solid #333" }}>{index + 1}</td>
                  <td style={{ padding: "8px", border: "1px solid #333" }}>{line.description}</td>
                  <td style={{ padding: "8px", textAlign: "center", border: "1px solid #333" }}>{line.unit}</td>
                  <td style={{ padding: "8px", textAlign: "center", border: "1px solid #333" }}>{Number(line.quantity || 0).toLocaleString("fr-FR")}</td>
                  <td style={{ padding: "8px", textAlign: "center", border: "1px solid #333" }}>{Number(line.unitPrice || 0).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                  <td style={{ padding: "8px", textAlign: "right", border: "1px solid #333" }}>{lineTotal.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Section avec remerciement/montant à gauche et tableau de totaux à droite */}
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "30px" }}>
          {/* Colonne gauche - Texte de remerciement et montant */}
          <div style={{ flex: "1" }}>
            <div style={{ fontSize: "13px", fontWeight: "bold", fontStyle: "italic", marginBottom: "15px", textTransform: "uppercase" }}>
              NOUS VOUS REMERCIONS DE VOTRE CONFIANCE.
            </div>
            <div style={{ fontSize: "11px" }}>
              <span style={{ fontWeight: "bold" }}>Montant en lettre:</span> {amountToWordsFR(grandTotal)}.
            </div>
          </div>

          {/* Colonne droite - Boîte de résumé */}
          <div style={{ border: "2px solid #333", padding: "12px", width: "240px", fontSize: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontWeight: "bold" }}>Total Hors TVA</span>
              <span style={{ fontWeight: "bold" }}>{totals.subtotal.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span>TVA</span>
              <span>{taxAmount.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span>Autres</span>
              <span>{otherFees > 0 ? otherFees.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : ""}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #333", paddingTop: "8px", marginTop: "8px", fontSize: "14px", fontWeight: "bold" }}>
              <span>Total TTC</span>
              <span>{grandTotal.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>

        {/* Section signature - QR Code et Sceau à gauche, Nom/Fonction/Signature à droite */}
        <div style={{ marginTop: "30px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          {/* Colonne gauche - QR Code et Sceau côte à côte */}
          <div style={{ flex: "1", paddingRight: "40px", display: "flex", alignItems: "flex-start", gap: "20px" }}>
            <div style={{ marginTop: "15px" }}>
              <div style={{ display: "inline-block", padding: "8px", backgroundColor: "white", border: "1px solid #ccc" }}>
                <QRCode value={form.watch("invoiceNumber") || ""} size={80} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
              </div>
            </div>
            {/* Sceau en grand à côté du QR Code */}
            <div style={{ marginTop: "15px" }}>
              <Image src="/assets/sc.png" alt="Sceau" width={120} height={120} style={{ maxHeight: "120px", height: "auto", width: "auto" }} />
            </div>
          </div>

          {/* Colonne droite - Signature, nom et fonction empilés verticalement */}
          <div style={{ flex: "1", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "15px" }}>
            {/* Signature agrandie en haut */}
            <div style={{ marginBottom: "10px" }}>
              <Image src="/assets/signature.png" alt="Signature" width={120} height={120} style={{ maxHeight: "120px", height: "auto", width: "auto" }} />
            </div>
            
            {/* Nom et fonction en dessous */}
            <div style={{ textAlign: "right", marginTop: "10px" }}>
              <div style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "4px" }}>SAEL BATUTA NKUMA</div>
              <div style={{ fontSize: "10px" }}>Contrôleur de gestion</div>
            </div>
          </div>
        </div>

        {/* Informations bancaires - Design compact en ligne */}
        <div style={{ marginTop: "15px", marginBottom: "20px" }}>
          <div style={{ fontSize: "9px", fontWeight: "bold", marginBottom: "8px", color: "#333" }}>INFORMATIONS BANCAIRES</div>
          <div style={{ display: "flex", gap: "6px", fontSize: "7px", flexWrap: "wrap" }}>
            {/* Raw Bank USD */}
            <div style={{ border: "1px solid #ddd", borderRadius: "3px", padding: "5px", backgroundColor: "#fafafa", flex: "1", minWidth: "0" }}>
              <div style={{ fontWeight: "bold", marginBottom: "3px", color: "#333", fontSize: "8px" }}>Raw Bank</div>
              <div style={{ marginBottom: "2px" }}><span style={{ fontWeight: "600" }}>D:</span> USD</div>
              <div style={{ marginBottom: "2px", wordBreak: "break-all" }}><span style={{ fontWeight: "600" }}>N°:</span> 5100-5101-1125487001-47</div>
              <div><span style={{ fontWeight: "600" }}>Swift:</span> RAWBCDKI</div>
            </div>
            {/* Raw Bank CDF */}
            <div style={{ border: "1px solid #ddd", borderRadius: "3px", padding: "5px", backgroundColor: "#fafafa", flex: "1", minWidth: "0" }}>
              <div style={{ fontWeight: "bold", marginBottom: "3px", color: "#333", fontSize: "8px" }}>Raw Bank</div>
              <div style={{ marginBottom: "2px" }}><span style={{ fontWeight: "600" }}>D:</span> CDF</div>
              <div style={{ marginBottom: "2px", wordBreak: "break-all" }}><span style={{ fontWeight: "600" }}>N°:</span> 5100-5101-1125487002-44</div>
              <div><span style={{ fontWeight: "600" }}>Swift:</span> RAWBCDKI</div>
            </div>
            {/* Bank of Africa USD */}
            <div style={{ border: "1px solid #ddd", borderRadius: "3px", padding: "5px", backgroundColor: "#fafafa", flex: "1", minWidth: "0" }}>
              <div style={{ fontWeight: "bold", marginBottom: "3px", color: "#333", fontSize: "8px" }}>Bank of Africa</div>
              <div style={{ marginBottom: "2px" }}><span style={{ fontWeight: "600" }}>D:</span> USD</div>
              <div style={{ marginBottom: "2px", wordBreak: "break-all" }}><span style={{ fontWeight: "600" }}>N°:</span> 00029-01017-03103860005-84</div>
              <div><span style={{ fontWeight: "600" }}>Swift:</span> AFRICDKSXXX</div>
            </div>
            {/* BGFIBank USD */}
            <div style={{ border: "1px solid #ddd", borderRadius: "3px", padding: "5px", backgroundColor: "#fafafa", flex: "1", minWidth: "0" }}>
              <div style={{ fontWeight: "bold", marginBottom: "3px", color: "#333", fontSize: "8px" }}>BGFIBank</div>
              <div style={{ marginBottom: "2px" }}><span style={{ fontWeight: "600" }}>D:</span> USD</div>
              <div style={{ marginBottom: "2px", wordBreak: "break-all" }}><span style={{ fontWeight: "600" }}>N°:</span> 00031-26110-40044491011-21</div>
              <div><span style={{ fontWeight: "600" }}>Swift:</span> BGFICDKI</div>
            </div>
            {/* BGFIBank CDF */}
            <div style={{ border: "1px solid #ddd", borderRadius: "3px", padding: "5px", backgroundColor: "#fafafa", flex: "1", minWidth: "0" }}>
              <div style={{ fontWeight: "bold", marginBottom: "3px", color: "#333", fontSize: "8px" }}>BGFIBank</div>
              <div style={{ marginBottom: "2px" }}><span style={{ fontWeight: "600" }}>D:</span> CDF</div>
              <div style={{ marginBottom: "2px", wordBreak: "break-all" }}><span style={{ fontWeight: "600" }}>N°:</span> 00031-26100-40044491012-71</div>
              <div><span style={{ fontWeight: "600" }}>Swift:</span> BGFICDKI</div>
            </div>
          </div>
        </div>

        {/* Footer avec image */}
        <div style={{ marginTop: "20px", width: "100%" }}>
          <Image src="/assets/bas.png" alt="Pied de page AAGS" width={800} height={200} style={{ width: "100%", height: "auto", display: "block" }} />
        </div>
        </div>
      </div>
    </div>
  );
}
