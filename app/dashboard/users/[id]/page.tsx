import prisma from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import UserEditForm from "./user-edit-form";

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Utilisateur introuvable.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/users">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  return <UserEditForm initial={{ id: user.id, name: user.name ?? "", email: user.email, image: user.image ?? "", emailVerified: user.emailVerified, role: user.role as any }} />;
}


