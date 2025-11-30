"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Droplets, MapPin, Calendar, Database, Activity, Warehouse, Package } from "lucide-react";

interface TankData {
  id: string;
  name: string;
  capacity: number;
  currentLevel: number;
  unit: string;
  depotId: string;
  produitId?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  depot?: {
    id: string;
    name: string;
    address: string;
  };
  produit?: {
    id: string;
    nom: string;
    description?: string;
  };
}

interface ViewTankDetailsProps {
  tank: TankData;
}

export default function ViewTankDetails({ tank }: ViewTankDetailsProps) {
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

  const getUnitLabel = (unit: string) => {
    const unitLabels: Record<string, string> = {
      'L': 'Litre',
      'KG': 'Kilogramme',
      'G': 'Gramme',
      'ML': 'Millilitre',
      'TONNE': 'Tonne',
      'PIECE': 'Pièce',
      'BOITE': 'Boîte',
      'CAISSON': 'Caisson'
    };
    return unitLabels[unit] || unit;
  };

  const getCapacityPercentage = () => {
    if (tank.capacity === 0) return 0;
    return Math.round((tank.currentLevel / tank.capacity) * 100);
  };

  const getCapacityColor = (percentage: number) => {
    if (percentage < 10) return 'text-red-500';
    if (percentage < 30) return 'text-orange-500';
    if (percentage < 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Informations principales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            Informations Générales
          </CardTitle>
          <CardDescription>
            Détails de base du tank
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Nom</span>
              <span className="font-semibold">{tank.name}</span>
            </div>
            <Separator />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Capacité</span>
              <span className="font-semibold">{tank.capacity} {tank.unit}</span>
            </div>
            <Separator />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Niveau Actuel</span>
              <span className={`font-semibold ${getCapacityColor(getCapacityPercentage())}`}>
                {tank.currentLevel} {tank.unit}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getCapacityColor(getCapacityPercentage()).replace('text-', 'bg-')}`}
                style={{ width: `${getCapacityPercentage()}%` }}
              ></div>
            </div>
            <p className="text-sm text-muted-foreground">
              {getCapacityPercentage()}% de la capacité
            </p>
            <Separator />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Unité</span>
              <Badge variant="outline">{getUnitLabel(tank.unit)}</Badge>
            </div>
            <Separator />
          </div>
        </CardContent>
      </Card>

      {/* Localisation et produit */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Localisation et Produit
          </CardTitle>
          <CardDescription>
            Dépôt et produit assignés
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Dépôt</p>
            <div className="flex items-center gap-2">
              <Warehouse className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg">{tank.depot?.name || "Aucun dépôt assigné"}</span>
            </div>
            {tank.depot?.address && (
              <p className="text-sm text-muted-foreground mt-1">{tank.depot.address}</p>
            )}
          </div>
          
          <Separator />
          
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Produit</p>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg">{tank.produit?.nom || "Aucun produit assigné"}</span>
            </div>
            {tank.produit?.description && (
              <p className="text-sm text-muted-foreground mt-1">{tank.produit.description}</p>
            )}
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
                <span className="font-medium">{formatDate(tank.createdAt)}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Dernière Mise à Jour</p>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formatDate(tank.updatedAt)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
