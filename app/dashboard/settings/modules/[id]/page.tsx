import prisma from "@/lib/prisma";
import Link from "next/link";
import EditForm from "./edit-form";

export default async function EditModulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const moduleItem = await prisma.module.findUnique({ where: { id } });
  if (!moduleItem) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Module introuvable.</p>
        </div>
        <Link href="/dashboard/settings/modules" className="inline-block">
          <span className="underline">Retour à la liste</span>
        </Link>
      </div>
    );
  }
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Modifier le module</h1>
        <Link href="/dashboard/settings/modules" className="underline">Retour</Link>
      </div>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <EditForm 
          id={moduleItem.id} 
          initial={{ 
            name: moduleItem.name, 
            type: moduleItem.type,
            description: moduleItem.description, 
            isActive: moduleItem.isActive,
          }} 
        />
      </div>
    </div>
  );
}
