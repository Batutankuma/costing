import { getFournisseurById } from "../actions";
import EditForm from "./edit-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2 } from "lucide-react";

export default async function EditFournisseurPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fournisseur = await getFournisseurById(id);
  
  if (!fournisseur) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Fournisseur introuvable.</p>
        </div>
        <Link href="/dashboard/fournisseurs" className="inline-block">
          <span className="underline">Retour à la liste</span>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/fournisseurs">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div className="h-6 w-px bg-border" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            Modifier le Fournisseur
          </h1>
          <p className="text-muted-foreground">
            Mettez à jour les informations du fournisseur
          </p>
        </div>
      </div>
      
      <EditForm 
        id={fournisseur.id} 
        initial={{ nom: fournisseur.nom, adresse: fournisseur.adresse ?? "" }} 
      />
    </div>
  );
}

