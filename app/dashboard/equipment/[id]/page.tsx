import { redirect } from "next/navigation";
import { findByIdAction } from "../actions";
// Tabs component does not exist in the UI library; refactor to simple layout
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Droplets, MapPin, Calendar, Edit, Eye, ArrowLeft, Database, Activity } from "lucide-react";
import Link from "next/link";
import EditEquipmentForm from "./edit-form";
import ViewEquipmentDetails from "./view-details";

export default async function EquipmentDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  // Récupérer les données de l'équipement
  const result = await findByIdAction(id);
  
  if (!result.success || !result.result) {
    redirect('/dashboard/equipment');
  }
  
  const equipmentRaw = result.result;
  // Mapper les données pour convertir null en undefined
  const equipment = {
    ...equipmentRaw,
    depotId: equipmentRaw.depotId || undefined,
    produitId: equipmentRaw.produitId || undefined,
    depot: equipmentRaw.depot ? {
      id: equipmentRaw.depot.id,
      name: equipmentRaw.depot.name,
      address: equipmentRaw.depot.location || "",
    } : undefined,
    produit: equipmentRaw.produit ? {
      id: equipmentRaw.produit.id,
      nom: equipmentRaw.produit.name,
    } : undefined,
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/equipment">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Droplets className="h-8 w-8 text-primary" />
              {equipment.name}
            </h1>
            <p className="text-muted-foreground">
              Gestion de l'équipement et de ses informations
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {equipment.unit}
          </Badge>
          <Badge variant="outline">
            {equipment.depot?.name || "Dépôt non assigné"}
          </Badge>
        </div>
      </div>

      {/* Sections empilées */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Vue d&apos;ensemble
            </CardTitle>
            <CardDescription>Détails actuels de l'équipement</CardDescription>
          </CardHeader>
          <CardContent>
            <ViewEquipmentDetails equipment={equipment} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Modifier
            </CardTitle>
            <CardDescription>Mettre à jour les informations de l'équipement</CardDescription>
          </CardHeader>
          <CardContent>
            <EditEquipmentForm equipment={equipment} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}