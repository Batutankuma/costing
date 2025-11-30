"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteKinshasaCosting } from "./actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface RemoveDialogProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  id: string;
  title: string;
}

export default function RemoveDialog({ open, setOpen, id, title }: RemoveDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteKinshasaCosting({ id });
      if (result?.data?.failure) {
        toast({
          variant: "destructive",
          title: "Suppression impossible",
          description: result.data.failure,
        });
        return;
      }
      toast({ title: "Costing supprimé", description: `"${title}" a été supprimé.` });
      router.refresh();
      setOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer ce costing ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible et supprimera définitivement <strong>{title}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Suppression..." : "Supprimer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

