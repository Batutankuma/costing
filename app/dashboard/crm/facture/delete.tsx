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
import { removeFactureAction } from "./actions";
import { useToast } from "@/hooks/use-toast";

export default function DeleteFactureButton({ id, invoiceNumber, children }: { id: string; invoiceNumber: string; children: ReactNode }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await removeFactureAction({ id });
      if ((result as any)?.data?.success) {
        toast({ title: "Facture supprimée", description: `La facture ${invoiceNumber} a été supprimée.` });
        window.location.reload();
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: (result as any)?.data?.failure || "Impossible de supprimer la facture.",
        });
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer la facture ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. La facture {invoiceNumber} sera définitivement supprimée.
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
