import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ClientEditForm from "./user-edit-form";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } });

  if (!client) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Modifier Client</h1>
              <p className="text-muted-foreground">Édition des informations client</p>
            </div>
          </div>
        </div>
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Client introuvable.</p>
        </div>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/dashboard/clients">Retour</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Modifier Client</h1>
            <p className="text-muted-foreground">Édition des informations client</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/clients">Annuler</Link>
          </Button>
        </div>
      </div>
      <ClientEditForm initial={{ id: client.id, name: client.name, company: client.company ?? "", email: client.email ?? "", phone: client.phone ?? "", address: client.address ?? "", notes: client.notes ?? "" }} />
    </div>
  );
}










