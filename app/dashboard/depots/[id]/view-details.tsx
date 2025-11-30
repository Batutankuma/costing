"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Warehouse, MapPin, Calendar, Database, Activity } from "lucide-react";

interface DepotData {
  id: string;
  name: string;
  address: string;
  capacity?: number;
  type: "OWNED" | "EXTERNAL";
  status: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

interface ViewDepotDetailsProps {
  depot: DepotData;
}

export default function ViewDepotDetails({ depot }: ViewDepotDetailsProps) {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type: string) => {
    return type === "OWNED" ? "Dépôt Interne" : "Dépôt Externe";
  };

  const getTypeDescription = (type: string) => {
    return type === "OWNED" 
      ? "Dépôt appartenant à l'entreprise" 
      : "Dépôt externe partenaire";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Informations principales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-primary" />
            Informations Générales
          </CardTitle>
          <CardDescription>
            Détails de base du dépôt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Nom</span>
              <span className="font-semibold">{depot.name}</span>
            </div>
            <Separator />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Type</span>
              <Badge variant="outline">{getTypeLabel(depot.type)}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{getTypeDescription(depot.type)}</p>
            <Separator />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Statut</span>
              <Badge variant={depot.status ? "default" : "secondary"}>
                {depot.status ? "Actif" : "Inactif"}
              </Badge>
            </div>
            <Separator />
          </div>
          
          {depot.capacity && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Capacité</span>
                  <span className="font-semibold">{depot.capacity}</span>
                </div>
                <Separator />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Adresse et localisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Localisation
          </CardTitle>
          <CardDescription>
            Adresse et informations de localisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Adresse</p>
              <p className="text-lg">{depot.address || "Aucune adresse spécifiée"}</p>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span>Localisation du dépôt</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations temporelles */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Informations Temporelles
          </CardTitle>
          <CardDescription>
            Dates de création et de dernière modification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Date de Création</p>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formatDate(depot.createdAt)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Dernière Mise à Jour</p>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formatDate(depot.updatedAt)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
