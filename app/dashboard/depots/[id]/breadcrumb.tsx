"use client";

import { ChevronRight, Home, Warehouse } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface BreadcrumbProps {
  depotName: string;
}

export default function Breadcrumb({ depotName }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
      <Link href="/dashboard">
        <Button variant="ghost" size="sm" className="h-auto p-1">
          <Home className="h-4 w-4" />
        </Button>
      </Link>
      
      <ChevronRight className="h-4 w-4" />
      
      <Link href="/dashboard/depots">
        <Button variant="ghost" size="sm" className="h-auto p-1">
          Dépôts
        </Button>
      </Link>
      
      <ChevronRight className="h-4 w-4" />
      
      <Link href="/dashboard/depots">
        <Button variant="ghost" size="sm" className="h-auto p-1">
          <Warehouse className="h-4 w-4 mr-1" />
          Dépôts
        </Button>
      </Link>
      
      <ChevronRight className="h-4 w-4" />
      
      <span className="font-medium text-foreground">{depotName}</span>
    </nav>
  );
}
