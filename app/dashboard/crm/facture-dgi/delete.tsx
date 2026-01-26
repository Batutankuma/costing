'use client';

import { ReactNode, useTransition } from "react";
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
import { deleteDGIFactureAction } from "./actions";
import { useToast } from "@/hooks/use-toast";

export default function DeleteFactureDgiButton({ id, invoiceNumber, children }: { id: string; invoiceNumber: string; children: ReactNode }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteDGIFactureAction({ id });
      if (result?.data?.success) {
        toast({ title: "Facture DGI supprimée", description: `La facture DGI ${invoiceNumber} a été supprimée.` });
        window.location.reload();
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: result?.serverError || "Impossible de supprimer la facture DGI.",
        });
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer la facture DGI ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. La facture DGI {invoiceNumber} sera définitivement supprimée.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

