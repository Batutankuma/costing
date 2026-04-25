"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CircleAlert } from "lucide-react";
import { deleteDelivery } from "./actions";
import { useAction } from "next-safe-action/hooks";
import { useToast } from "@/hooks/use-toast";

export default function RemoveDialog({ open, setOpen, Id, nameClient }: { open: boolean; setOpen: (value: boolean) => void; Id: string; nameClient: string; }) {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { executeAsync, status } = useAction(deleteDelivery);
  const basePath = pathname.startsWith("/dashboard/delivery-lbb")
    ? "/dashboard/delivery-lbb"
    : "/dashboard/delivery";

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) return null;

  async function deleteElement() {
    const result = await executeAsync({ id: Id });
    if (result?.data?.success) {
      toast({ title: "Suppression reussie", description: "La livraison a ete supprimee." });
      setOpen(false);
      router.push(basePath);
      router.refresh();
    } else {
      const failure = result?.data?.failure || "Suppression impossible";
      console.error("Erreur lors de la suppression du delivery:", failure);
      toast({ variant: "destructive", title: "Erreur", description: failure });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border">
            <CircleAlert className="opacity-80" size={16} strokeWidth={2} />
          </div>
          <DialogHeader>
            <DialogTitle className="text-center">Confirmation</DialogTitle>
            <DialogDescription className="text-center">
              Cette action est irréversible. Pour confirmer, entrez <strong>{nameClient}</strong> ci-dessous.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {nameClient ? `Element: ${nameClient}` : "Confirmez la suppression de cette livraison."}
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            className="bg-red-600 text-white"
            disabled={status === "executing"}
            onClick={deleteElement}
          >
            {status === "executing" ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
