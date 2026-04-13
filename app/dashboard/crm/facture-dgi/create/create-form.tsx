"use client";

import * as React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DGIFactureSchema } from "../schema";
import { createDGIFactureAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
// import { toast } from "sonner"; 
import { z } from "zod";

type Client = {
    id: string;
    name: string;
    nif?: string | null;
    address?: string | null;
    rccm?: string | null;
}

interface CreateDGIFactureFormProps {
    clients: Client[];
}

type FormData = z.infer<typeof DGIFactureSchema>;

export function CreateDGIFactureForm({ clients }: CreateDGIFactureFormProps) {
    const router = useRouter();
    const { executeAsync, status } = useAction(createDGIFactureAction);
    const isPending = status === "executing";

    const form = useForm<FormData>({
        resolver: zodResolver(DGIFactureSchema),
        defaultValues: {
            invoiceDate: new Date(),
            currency: "USD",
            lines: [
                { description: "", quantity: 1, unitPrice: 0, tvaRate: 16 }
            ]
        } as any
    });

    const { register, control, handleSubmit, watch, setValue, formState: { errors } } = form;
    const { fields, append, remove } = useFieldArray({
        control,
        name: "lines"
    });

    // Auto-fill client details when a client is selected
    const watchClientId = watch("clientId");
    React.useEffect(() => {
        if (watchClientId) {
            const client = clients.find(c => c.id === watchClientId);
            if (client) {
                setValue("clientName", client.name);
                setValue("clientNif", client.nif || "");
                setValue("clientAddress", client.address || "");
                setValue("clientRccm", client.rccm || "");
            }
        }
    }, [watchClientId, clients, setValue]);

    // Calculate totals for display
    const lines = watch("lines");
    const totals = React.useMemo(() => {
        let ht = 0;
        let tva = 0;
        lines.forEach(line => {
            const q = Number(line.quantity) || 0;
            const p = Number(line.unitPrice) || 0;
            const t = Number(line.tvaRate) || 0;
            const lineHt = q * p;
            const lineTva = lineHt * (t / 100);
            ht += lineHt;
            tva += lineTva;
        });
        return { ht, tva, ttc: ht + tva };
    }, [lines]);

    const onSubmit = async (data: FormData) => {
        try {
            const res = await executeAsync(data);
            if (res?.data?.success) {
                // toast.success("Facture créée avec succès");
                router.push("/dashboard/crm/facture-dgi");
            } else {
                // Error handling
                console.error("Error creating facture", res);
            }
        } catch (error) {
            console.error("Submission error", error);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <p className="text-sm text-muted-foreground">
                <span className="text-destructive">*</span> Champs obligatoires
            </p>
            <div className="grid gap-6 md:grid-cols-2">
                {/* Client Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informations Client</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Sélectionner un client (CRM)</Label>
                            <Select onValueChange={(val) => setValue("clientId", val)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir un client..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map((client) => (
                                        <SelectItem key={client.id} value={client.id}>
                                            {client.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Nom du Client *</Label>
                            <Input {...register("clientName")} placeholder="Nom ou Raison Sociale" />
                            {errors.clientName && <p className="text-red-500 text-sm">{errors.clientName.message}</p>}
                        </div>

                        <div className="grid gap-2">
                            <Label>NIF</Label>
                            <Input {...register("clientNif")} placeholder="Numéro Impôt" />
                        </div>

                        <div className="grid gap-2">
                            <Label>RCCM</Label>
                            <Input {...register("clientRccm")} />
                        </div>

                        <div className="grid gap-2">
                            <Label>Adresse</Label>
                            <Textarea {...register("clientAddress")} />
                        </div>
                    </CardContent>
                </Card>

                {/* Invoice Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Détails Facture</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Date de facturation <span className="text-destructive">*</span></Label>
                            <Input
                                type="date"
                                {...register("invoiceDate", { valueAsDate: true })}
                                defaultValue={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Devise <span className="text-destructive">*</span></Label>
                            <Select
                                defaultValue="USD"
                                onValueChange={(val) => setValue("currency", val as "USD" | "CDF")}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Devise" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                    <SelectItem value="CDF">CDF (FC)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Notes</Label>
                            <Textarea {...register("notes")} placeholder="Conditions de paiement, etc." />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Lines */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Lignes de la facture</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "", quantity: 1, unitPrice: 0, tvaRate: 16 })}>
                        <Plus className="mr-2 h-4 w-4" /> Ajouter une ligne
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="hidden md:grid grid-cols-12 gap-4 font-medium text-sm text-muted-foreground mb-2">
                        <div className="col-span-5">Description</div>
                        <div className="col-span-2 text-right">Qté</div>
                        <div className="col-span-2 text-right">P.U.</div>
                        <div className="col-span-2 text-right">TVA %</div>
                        <div className="col-span-1"></div>
                    </div>

                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border-b pb-4 md:border-0 md:pb-0">
                            <div className="md:col-span-5">
                                <Label className="md:hidden">Description</Label>
                                <Input {...register(`lines.${index}.description`)} placeholder="Description produit/service" />
                                {errors.lines?.[index]?.description && <p className="text-red-500 text-xs">{errors.lines[index]?.description?.message}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <Label className="md:hidden">Quantité</Label>
                                <Input type="number" step="any" {...register(`lines.${index}.quantity`, { valueAsNumber: true })} className="text-right" />
                            </div>
                            <div className="md:col-span-2">
                                <Label className="md:hidden">Prix Unitaire</Label>
                                <Input type="number" step="any" {...register(`lines.${index}.unitPrice`, { valueAsNumber: true })} className="text-right" />
                            </div>
                            <div className="md:col-span-2">
                                <Label className="md:hidden">TVA %</Label>
                                <Input type="number" step="any" {...register(`lines.${index}.tvaRate`, { valueAsNumber: true })} className="text-right" />
                            </div>
                            <div className="md:col-span-1 flex justify-end">
                                <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {errors.lines && <p className="text-red-500 text-sm">{errors.lines.message}</p>}

                    <div className="flex justify-end mt-8 pt-4 border-t">
                        <div className="w-full md:w-1/3 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total HT:</span>
                                <span className="font-mono">{totals.ht.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total TVA:</span>
                                <span className="font-mono">{totals.tva.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total TTC:</span>
                                <span>{totals.ttc.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
                    Annuler
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enregistrer la facture
                </Button>
            </div>
        </form>
    );
}
