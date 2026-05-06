"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CircleAlert } from "lucide-react";
import { deleteHospitality } from "./actions";
import { useAction } from "next-safe-action/hooks";
import { useToast } from "@/hooks/use-toast";

export default function RemoveDialog({
  open,
  setOpen,
  Id,
  nameClient,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  Id: string;
  nameClient: string;
}) {
  const [inputValue, setInputValue] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { executeAsync, status } = useAction(deleteHospitality);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  async function deleteElement() {
    const result = await executeAsync({ id: Id });
    if (result?.data?.success) {
      toast({ title: "Suppression reussie", description: "La ligne hospitality a ete supprimee." });
      router.push("/dashboard/hospitality");
      router.refresh();
      setOpen(false);
      return;
    }
    const failure = result?.data?.failure || "Suppression impossible";
    console.error("Erreur lors de la suppression de hospitality:", failure);
    toast({ variant: "destructive", title: "Erreur", description: failure });
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
          <Label htmlFor="hospitalityName">Driver s name</Label>
          <Input
            id="hospitalityName"
            type="text"
            placeholder={`Tapez ${nameClient} pour confirmer`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            className="bg-red-600 text-white"
            disabled={inputValue.trim() !== nameClient || status === "executing"}
            onClick={deleteElement}
          >
            {status === "executing" ? "Suppression..." : "Supprimer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
