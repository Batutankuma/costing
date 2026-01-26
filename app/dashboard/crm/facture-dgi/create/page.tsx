import { CreateDGIFactureForm } from "./create-form";
import prisma from "@/lib/prisma";

export default async function CreateDGIFacturePage() {
    const clients = await prisma.client.findMany({
        select: {
            id: true,
            name: true,
            nif: true,
            address: true,
            rccm: true,
        },
        orderBy: { name: "asc" }
    });

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6 pb-24">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Nouvelle Facture DGI</h1>
                <p className="text-muted-foreground">Créer une facture normalisée.</p>
            </div>

            <CreateDGIFactureForm clients={clients} />
        </div>
    );
}
