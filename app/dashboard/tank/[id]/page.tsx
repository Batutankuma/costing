import { redirect } from "next/navigation";
import { findByIdAction } from "../actions";
// Tabs component does not exist in the UI library; refactor to simple layout
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Droplets, MapPin, Calendar, Edit, Eye, ArrowLeft, Database, Activity } from "lucide-react";
import Link from "next/link";
import EditTankForm from "./edit-form";
import ViewTankDetails from "./view-details";

export default async function TankDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  
  // Récupérer les données du tank
  const result = await findByIdAction(id);
  
  if (!result.success || !result.result) {
    redirect('/dashboard/stock/tank');
  }
  
  const tank = result.result;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/stock/tank">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Droplets className="h-8 w-8 text-primary" />
              {tank.name}
            </h1>
            <p className="text-muted-foreground">
              Gestion du tank et de ses informations
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {tank.unit}
          </Badge>
          <Badge variant="outline">
            {tank.depot?.name || "Dépôt non assigné"}
          </Badge>
        </div>
      </div>

      {/* Sections empilées */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Vue d'ensemble
            </CardTitle>
            <CardDescription>Détails actuels du tank</CardDescription>
          </CardHeader>
          <CardContent>
            <ViewTankDetails tank={tank} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Modifier
            </CardTitle>
            <CardDescription>Mettre à jour les informations du tank</CardDescription>
          </CardHeader>
          <CardContent>
            <EditTankForm tank={tank} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}