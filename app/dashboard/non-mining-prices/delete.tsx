"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteNonMiningPriceStructure } from "./actions";
import { useToast } from "@/hooks/use-toast";

interface DeleteNonMiningPriceProps {
  id: string;
  nomStructure: string;
}

export function DeleteNonMiningPrice({ id, nomStructure }: DeleteNonMiningPriceProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteNonMiningPriceStructure(id);
      toast({ title: "Succès", description: "Structure de prix supprimée avec succès" });
      router.push("/dashboard/non-mining-prices");
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast({ title: "Erreur", description: "Erreur lors de la suppression de la structure de prix", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action ne peut pas être annulée. Cela supprimera définitivement la structure de prix{" "}
            <span className="font-semibold">"{nomStructure}"</span> et toutes ses données associées.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
