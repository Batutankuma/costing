"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus, 
  List, 
  Package, 
  BarChart3, 
  FileText,
  Truck
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function QuickNav() {
  const router = useRouter();

  const navigationItems = [
    {
      title: "Tableau de bord",
      description: "Vue d'ensemble des réceptions et commandes",
      icon: BarChart3,
      url: "/dashboard/reception/dashboard",
      variant: "default" as const,
      color: "bg-blue-500 hover:bg-blue-600"
    },
    {
      title: "Liste des réceptions",
      description: "Gérer et consulter toutes les réceptions",
      icon: List,
      url: "/dashboard/reception/list",
      variant: "outline" as const,
      color: "bg-green-500 hover:bg-green-600"
    },
    {
      title: "Nouvelle réception",
      description: "Créer une nouvelle réception de produits",
      icon: Plus,
      url: "/dashboard/reception/create",
      variant: "outline" as const,
      color: "bg-purple-500 hover:bg-purple-600"
    },
    {
      title: "Commandes",
      description: "Gérer les commandes et leur statut",
      icon: Package,
      url: "/dashboard/commande",
      variant: "outline" as const,
      color: "bg-orange-500 hover:bg-orange-600"
    },
    {
      title: "Stocks",
      description: "Consulter l'état des stocks",
      icon: FileText,
      url: "/dashboard/stock/stocks",
      variant: "outline" as const,
      color: "bg-indigo-500 hover:bg-indigo-600"
    },
    {
      title: "Tanks",
      description: "Gérer les niveaux des tanks",
      icon: Truck,
      url: "/dashboard/stock/tank",
      variant: "outline" as const,
      color: "bg-teal-500 hover:bg-teal-600"
    }
  ];

  return (
    <div className="mb-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Navigation rapide - Réceptions
        </h2>
        <p className="text-gray-600">
          Accédez rapidement à toutes les fonctionnalités liées aux réceptions
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {navigationItems.map((item, index) => (
          <Card 
            key={index} 
            className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
            onClick={() => router.push(item.url)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${item.color} text-white group-hover:scale-110 transition-transform duration-200`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg group-hover:text-blue-600 transition-colors duration-200">
                    {item.title}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-200">
                {item.description}
              </CardDescription>
              <div className="mt-3">
                <Button 
                  variant={item.variant} 
                  className="w-full group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-all duration-200"
                >
                  Accéder
                  <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    →
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
