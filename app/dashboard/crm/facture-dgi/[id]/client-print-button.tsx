 "use client";

 import { Button } from "@/components/ui/button";
 import { Printer } from "lucide-react";

 export default function PrintButton() {
   const handlePrint = () => {
     if (typeof window !== "undefined") {
       window.print();
     }
   };

   return (
     <Button variant="outline" className="gap-2" onClick={handlePrint}>
       <Printer className="h-4 w-4" />
       Imprimer
     </Button>
   );
 }


