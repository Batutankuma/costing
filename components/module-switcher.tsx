"use client";

import * as React from "react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RiExpandUpDownLine } from "@remixicon/react";

export type ModuleType = 
  | "AAGS"
  | "CRM"
  | "FINANCE"
  | "DEPOT_AUTRES"
  | "DEPOT_KALEMIE"
  | "DEPOT_LUBUMBASHI"
  | "DEPOT_KINSHASA"
  | "OPERATION";

export function ModuleSwitcher({
  activeModule,
  onModuleChange,
}: {
  activeModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
}) {
  const modules: { value: ModuleType; label: string }[] = [
    { value: "AAGS", label: "AAGS" },
    { value: "CRM", label: "CRM" },
    { value: "FINANCE", label: "Finance" },
    { value: "DEPOT_AUTRES", label: "Dépôt Autres" },
    { value: "DEPOT_KALEMIE", label: "Dépôt Kalemie" },
    { value: "DEPOT_LUBUMBASHI", label: "Dépôt Lubumbashi" },
    { value: "DEPOT_KINSHASA", label: "Dépôt Kinshasa" },
    { value: "OPERATION", label: "Opération" },
  ];

  const activeModuleLabel = modules.find(m => m.value === activeModule)?.label ?? "Sélectionner un module";
  const activeModuleInitial = activeModule === "AAGS" ? "A" : 
                               activeModule === "CRM" ? "C" :
                               activeModule === "FINANCE" ? "F" :
                               activeModule === "DEPOT_AUTRES" ? "DA" :
                               activeModule === "DEPOT_KALEMIE" ? "DK" :
                               activeModule === "DEPOT_LUBUMBASHI" ? "DL" :
                               activeModule === "DEPOT_KINSHASA" ? "DK" : "O";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground gap-3 [&>svg]:size-auto"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-md overflow-hidden bg-sidebar-primary text-sidebar-primary-foreground">
                <span className="text-xs font-bold">
                  {activeModuleInitial}
                </span>
              </div>
              <div className="grid flex-1 text-left text-base leading-tight">
                <span className="truncate font-medium">
                  {activeModuleLabel}
                </span>
              </div>
              <RiExpandUpDownLine
                className="ms-auto text-muted-foreground/60"
                size={20}
                aria-hidden="true"
              />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-md"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuLabel className="uppercase text-muted-foreground/60 text-xs">
              Modules
            </DropdownMenuLabel>
            {modules.map((module) => (
              <DropdownMenuItem
                key={module.value}
                onClick={() => onModuleChange(module.value)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md overflow-hidden bg-sidebar-primary text-sidebar-primary-foreground">
                  <span className="text-xs font-bold">
                    {module.value === "AAGS" ? "A" : 
                     module.value === "CRM" ? "C" :
                     module.value === "FINANCE" ? "F" :
                     module.value === "DEPOT_AUTRES" ? "DA" :
                     module.value === "DEPOT_KALEMIE" ? "DK" :
                     module.value === "DEPOT_LUBUMBASHI" ? "DL" :
                     module.value === "DEPOT_KINSHASA" ? "DK" : "O"}
                  </span>
                </div>
                {module.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
