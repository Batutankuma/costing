"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { removeByIdAction } from "./actions";

interface DeleteReceptionProps {
  receptionId: string;
  receptionReference?: string;
  onDelete?: () => void;
}

export default function DeleteReception({ 
  receptionId, 
  receptionReference, 
  onDelete 
}: DeleteReceptionProps) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
     
      const result = await removeByIdAction(receptionId);
      
      if (result?.success) {
        toast({
          title: "Succès",
          description: result.message || "Réception supprimée avec succès"
        });
        setOpen(false);
        
        // Appeler le callback de rafraîchissement
        if (onDelete) {
        onDelete();
        }
        
        // Forcer un rafraîchissement de la page si pas de callback
        if (!onDelete) {
        window.location.reload();
        }
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result?.failure || "Erreur lors de la suppression"
        });
      }
    } catch (error) {
      console.error("❌ Erreur lors de la suppression:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur inattendue s'est produite"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Confirmer la suppression
          </AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer cette réception ?
            <br />
            <br />
            <strong>Attention :</strong> Cette action est irréversible et aura les conséquences suivantes :
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>La réception sera supprimée définitivement</li>
              <li>Le stock sera diminué de la quantité reçue</li>
              <li>Le niveau du tank sera diminué (si applicable)</li>
              <li>La quantité restante de la commande sera augmentée</li>
              <li>Le statut de la commande sera mis à jour</li>
            </ul>
            <br />
            <span className="font-medium">
              Réception : {receptionReference || receptionId}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Suppression..." : "Supprimer définitivement"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
