import { findBuilderById } from "../actions";
import BuilderEditForm from "./builder-edit-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await findBuilderById(id);
  const item = (res as any)?.result;
  
  if (!item) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Modifier Builder</h1>
              <p className="text-muted-foreground">Édition d'une structure de coûts</p>
            </div>
          </div>
        </div>
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Builder introuvable.</p>
        </div>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/dashboard/builders">Retour</Link>
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
            <h1 className="text-3xl font-bold tracking-tight">Modifier Builder</h1>
            <p className="text-muted-foreground">Édition d'une structure de coûts</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/builders">Annuler</Link>
          </Button>
        </div>
      </div>
      <BuilderEditForm item={item} />
    </div>
  );
}


