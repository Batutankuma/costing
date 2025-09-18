"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

export function DeleteClient({ id, name }: { id: string; name: string }) {
  const [loading, setLoading] = useState(false);
  const onDelete = async () => {
    setLoading(true);
    try { await fetch(`/api/clients/${id}`, { method: "DELETE" }); } finally { setLoading(false); location.reload(); }
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="text-destructive hover:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Supprimer</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer le client ?</AlertDialogTitle>
          <AlertDialogDescription>Cette action est irréversible. {name}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete} disabled={loading} className="bg-destructive">{loading ? "Suppression..." : "Supprimer"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}










