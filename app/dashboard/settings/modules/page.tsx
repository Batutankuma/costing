import prisma from "@/lib/prisma";
import DataTables from "./data-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function ModulesPage() {
  const data = await prisma.module.findMany({ 
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          userModules: true
        }
      }
    }
  });
  
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl mb-2 font-semibold">Modules</h1>
          <p className="text-muted-foreground">Gérez les modules disponibles dans le système</p>
        </div>
        <Link href="/dashboard/settings/modules/create">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau Module
          </Button>
        </Link>
      </div>
      <DataTables Element={data || []} />
    </div>
  );
}
