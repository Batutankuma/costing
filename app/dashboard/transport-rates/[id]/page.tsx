import { getTransportRateById } from "../actions";
import EditForm from "./edit-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Truck } from "lucide-react";

export default async function EditTransportRatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const transportRate = await getTransportRateById(id);
  
  if (!transportRate) {
    return (
      <div className="p-6 space-y-4 max-w-xl mx-auto">
        <div className="text-destructive bg-destructive/10 p-4 rounded-md">
          <p className="font-medium">Tarif de transport introuvable.</p>
        </div>
        <Link href="/dashboard/transport-rates" className="inline-block">
          <span className="underline">Retour à la liste</span>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/transport-rates">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
        </Link>
        <div className="h-6 w-px bg-border" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="h-8 w-8 text-primary" />
            Modifier le Tarif de Transport
          </h1>
          <p className="text-muted-foreground">
            Mettez à jour les informations du tarif
          </p>
        </div>
      </div>
      
      <EditForm 
        id={transportRate.id} 
        initial={{ 
          destination: transportRate.destination, 
          rateUsdPerCbm: transportRate.rateUsdPerCbm 
        }} 
      />
    </div>
  );
}

