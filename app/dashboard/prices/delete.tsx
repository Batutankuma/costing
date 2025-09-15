"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CircleAlert } from "lucide-react";
import { removeByIdAction } from "./actions";
import { useToast } from "@/hooks/use-toast";

export default function RemoveDialog({ Id, nameClient, open: controlledOpen, onOpenChange: controlledOnOpenChange }: { Id: string; nameClient: string; open?: boolean; onOpenChange?: (v: boolean) => void }) {
  const isControlled = typeof controlledOpen === "boolean";
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = isControlled ? controlledOpen! : uncontrolledOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setUncontrolledOpen;
  const [inputValue, setInputValue] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => { setIsMounted(true); }, []);
  if (!isMounted) return null;

  async function deleteElement() {
    const { failure } = await removeByIdAction(Id);
    if (!failure) {
      router.push(`/dashboard/prices`);
      setOpen(false);
    } else {
      toast({ title: "Suppression impossible", description: failure, variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="destructive" className="w-full justify-start">Supprimer</Button>
        </DialogTrigger>
      )}
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
          <Label htmlFor="priceName">Nom</Label>
          <Input id="priceName" type="text" placeholder={`Tapez ${nameClient} pour confirmer`} value={inputValue} onChange={(e) => setInputValue(e.target.value)} />
        </div>
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
          <Button className="bg-red-600 text-white" disabled={inputValue.trim() !== nameClient} onClick={deleteElement}>Supprimer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


