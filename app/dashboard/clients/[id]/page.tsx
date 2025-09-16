import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ClientEditForm from "./user-edit-form";

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({ where: { id } });

  if (!client) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Client introuvable.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/clients">Retour</Link>
        </Button>
      </div>
    );
  }

  return <ClientEditForm initial={{ id: client.id, name: client.name, company: client.company ?? "", email: client.email ?? "", phone: client.phone ?? "", address: client.address ?? "", notes: client.notes ?? "" }} />;
}






