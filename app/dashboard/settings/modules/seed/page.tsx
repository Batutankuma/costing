"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { seedModules } from "../seed-modules";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function SeedModulesPage() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSeed = async () => {
    setLoading(true);
    try {
      const result = await seedModules();
      if (result.success) {
        toast({ title: "Succès", description: result.message });
      } else {
        toast({ variant: "destructive", title: "Erreur", description: result.message });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erreur", description: "Une erreur est survenue" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Initialiser les Modules</CardTitle>
          <CardDescription>
            Créez les modules de base dans le système (Finance, CRM, Dépôts, Opération)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSeed} disabled={loading}>
            {loading ? "Initialisation..." : "Initialiser les modules"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
