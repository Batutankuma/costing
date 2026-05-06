"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

import { SearchForm } from "@/components/search-form";
import { type ModuleType } from "@/components/module-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { 
  RiSettings3Line, 
  RiLogoutBoxLine, 
  RiDashboardLine, 
  RiFileTextLine, 
  RiUserLine, 
  RiTeamLine, 
  RiTruckLine, 
  RiPriceTagLine, 
  RiShoppingBagLine, 
  RiDatabaseLine, 
  RiFolderOpenLine, 
  RiGasStationLine, 
  RiShoppingCart2Line, 
  RiFlightTakeoffLine, 
  RiBillLine,
  RiStoreLine,
  RiMoneyDollarCircleLine,
  RiFileListLine,
  RiBankLine,
  RiCalendarLine,
  RiLuggageDepositLine,
} from "@remixicon/react";

// Structure de navigation par module
type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  disabled?: boolean;
};

type ModuleNav = {
  [key in ModuleType]: NavItem[];
};

type SessionUserWithRole = {
  role?: "ADMIN" | "COMMERCIAL";
  email?: string | null;
};

const moduleNavigation: ModuleNav = {
  AAGS: [
    { title: "Dashboard", url: "/dashboard", icon: RiDashboardLine },
  ],
  FINANCE: [
    { title: "Build Minier", url: "/dashboard/builders", icon: RiPriceTagLine },
    { title: "Build Non Minier", url: "/dashboard/non-mining-builders", icon: RiPriceTagLine },
    { title: "Tarif Transport", url: "/dashboard/transport-rates", icon: RiTruckLine },
    { title: "Str Non Minier", url: "/dashboard/non-mining-prices", icon: RiPriceTagLine },
    { title: "Str Minier", url: "/dashboard/prices", icon: RiPriceTagLine },
    { title: "Build Kalemie", url: "/dashboard/build-const-kalemie", icon: RiPriceTagLine },
    { title: "Costing Kinshasa", url: "/dashboard/kinshasa-costings", icon: RiPriceTagLine },
    { title: "Suivi des depenses", url: "/dashboard/suivi-depenses", icon: RiMoneyDollarCircleLine, disabled: true },
  ],
  CRM: [
    { title: "Devis", url: "/dashboard/sales-quotes", icon: RiFileTextLine },
    { title: "Clients", url: "/dashboard/clients", icon: RiUserLine },
    { title: "Prospects", url: "/dashboard/prospects", icon: RiTeamLine },
    { title: "Fournisseurs", url: "/dashboard/crm/fournisseur", icon: RiTruckLine },
    { title: "Factures", url: "/dashboard/crm/facture", icon: RiBillLine },
    { title: "Factures DGI", url: "/dashboard/crm/facture-dgi", icon: RiBillLine },
    { title: "Banques", url: "/dashboard/banque", icon: RiBankLine },
  ],
  DEPOT_AUTRES: [
    { title: "Ventes", url: "/dashboard/ventes", icon: RiStoreLine },
    { title: "Stocks", url: "/dashboard/stocks?depot=autres", icon: RiDatabaseLine },
  ],
  DEPOT_KALEMIE: [
    { title: "Équipement", url: "/dashboard/equipment?depot=kalemie", icon: RiGasStationLine },
    { title: "Truck", url: "/dashboard/truck", icon: RiTruckLine, disabled: true },
    { title: "Delivery", url: "/dashboard/delivery?depot=kalemie", icon: RiFlightTakeoffLine },
    { title: "Shipments", url: "/dashboard/shipments?depot=kalemie", icon: RiTruckLine },
    { title: "Stocks", url: "/dashboard/stocks?depot=kalemie", icon: RiDatabaseLine },
    { title: "Mouvement Caisse", url: "/dashboard/mouvement-caisse", icon: RiMoneyDollarCircleLine, disabled: true },
  ],
  DEPOT_LUBUMBASHI: [
    { title: "DeliveryLBB", url: "/dashboard/delivery-lbb", icon: RiFlightTakeoffLine },
    { title: "Stock Summary", url: "/dashboard/stocks?depot=lubumbashi", icon: RiDatabaseLine },
    { title: "Hospitality", url: "/dashboard/hospitality", icon: RiLuggageDepositLine },
    { title: "Transport", url: "/dashboard/transport", icon: RiTruckLine },
    { title: "Mouvement Caisse", url: "/dashboard/mouvement-caisse", icon: RiMoneyDollarCircleLine, disabled: true },
  ],
  DEPOT_KINSHASA: [
    { title: "Programme", url: "/dashboard/programme", icon: RiCalendarLine },
    { title: "Bon de livraison", url: "/dashboard/shipments?depot=kinshasa", icon: RiFileListLine },
    { title: "Mouvement Caisse", url: "/dashboard/mouvement-caisse", icon: RiMoneyDollarCircleLine, disabled: true },
  ],
  OPERATION: [
    { title: "Commandes", url: "/dashboard/commande", icon: RiShoppingCart2Line },
    { title: "Bon commande client", url: "/dashboard/client-orders", icon: RiFileListLine },
    { title: "Licences", url: "/dashboard/licence", icon: RiFileTextLine },
    { title: "Paiements Banque", url: "/dashboard/paiement-banque", icon: RiMoneyDollarCircleLine },
    { title: "Produits", url: "/dashboard/products", icon: RiShoppingBagLine },
    { title: "Stocks", url: "/dashboard/stocks", icon: RiDatabaseLine },
    { title: "Dépôts", url: "/dashboard/depots", icon: RiFolderOpenLine },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);
  const { data: session } = authClient.useSession();
  const [role, setRole] = React.useState<"ADMIN" | "COMMERCIAL" | undefined>(undefined);
  const [userModuleTypes, setUserModuleTypes] = React.useState<Set<string>>(new Set());
  const [loadingModules, setLoadingModules] = React.useState(true);
  
  React.useEffect(() => {
    let isMounted = true;
    
    const current = (session?.user as SessionUserWithRole | undefined)?.role;
    if (current) {
      setRole(current);
    }
    const email = session?.user?.email;
    if (!email) {
      if (isMounted) setLoadingModules(false);
      return;
    }
    
    // Charger le rôle et les modules de l'utilisateur
    Promise.all([
      fetch(`/api/user-role?email=${encodeURIComponent(email)}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/user-modules?email=${encodeURIComponent(email)}`).then(r => r.ok ? r.json() : null)
    ])
      .then(([roleData, modulesData]) => {
        if (!isMounted) return;
        
        // Définir le rôle
        if (roleData?.role === "ADMIN" || roleData?.role === "COMMERCIAL") {
          setRole(roleData.role);
        }
        
        // Définir les types de modules
        if (modulesData?.success) {
          if (modulesData.isAdmin) {
            // Admin voit tous les modules
            setUserModuleTypes(new Set());
          } else if (modulesData.moduleTypes && Array.isArray(modulesData.moduleTypes)) {
            setUserModuleTypes(new Set(modulesData.moduleTypes));
          }
        }
      })
      .catch((error) => {
        console.error("Erreur lors du chargement des modules:", error);
      })
      .finally(() => {
        if (isMounted) setLoadingModules(false);
      });
    
    return () => {
      isMounted = false;
    };
  }, [session]);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      await authClient.signOut();
      router.push("/login");
    } finally {
      setSigningOut(false);
    }
  };

  // Labels des modules
  const moduleLabels: Record<ModuleType, string> = {
    AAGS: "AAGS",
    CRM: "CRM",
    FINANCE: "Finance",
    DEPOT_AUTRES: "Dépôt Autres",
    DEPOT_KALEMIE: "Dépôt Kalemie",
    DEPOT_LUBUMBASHI: "Dépôt Lubumbashi",
    DEPOT_KINSHASA: "Dépôt Kinshasa",
    OPERATION: "Opération",
  };

  return (
    <Sidebar {...props} className="bg-white text-neutral-900">
      <SidebarHeader>
        <div className="px-2 py-3">
          <div className="flex items-center gap-2">
            <div className="flex aspect-square size-8 items-center justify-center rounded-md overflow-hidden bg-sidebar-primary text-sidebar-primary-foreground">
              <span className="text-xs font-bold">AAGS</span>
            </div>
            <span className="font-semibold text-base">AAGS</span>
          </div>
        </div>
        <hr className="border-t border-border mx-2 -mt-px" />
        <SearchForm className="mt-3" />
      </SidebarHeader>
      <SidebarContent>
        {/* Afficher les modules selon les permissions de l'utilisateur */}
        {(Object.keys(moduleNavigation) as ModuleType[]).map((moduleKey) => {
          const items = moduleNavigation[moduleKey];
          if (!items || items.length === 0) return null;

          // Mapper le moduleKey au type de module dans la base de données
          const moduleTypeMap: Record<ModuleType, string> = {
            AAGS: "AAGS",
            FINANCE: "FINANCE",
            CRM: "CRM",
            DEPOT_AUTRES: "DEPOT_AUTRES",
            DEPOT_KALEMIE: "DEPOT_KALEMIE",
            DEPOT_LUBUMBASHI: "DEPOT_LUBUMBASHI",
            DEPOT_KINSHASA: "DEPOT_KINSHASA",
            OPERATION: "OPERATION",
          };

          const moduleType = moduleTypeMap[moduleKey];

          // Déterminer si le module doit être affiché
          const shouldShowModule = 
            role === "ADMIN" || // Les admins voient tout
            moduleKey === "AAGS" || // AAGS toujours visible
            (loadingModules === false && userModuleTypes.has(moduleType)); // Vérifier si l'utilisateur a ce type de module

          if (!shouldShowModule) return null;

          return (
            <SidebarGroup key={moduleKey}>
              <SidebarGroupLabel className="uppercase text-muted-foreground/60">
                {moduleLabels[moduleKey]}
              </SidebarGroupLabel>
              <SidebarGroupContent className="px-2">
                <SidebarMenu>
                  {items.map((item) => {
                    const isActive =
                      item.url !== "#" &&
                      (pathname === item.url || pathname.startsWith(`${item.url.split("?")[0]}/`));

                    return (
                      <SidebarMenuItem key={`${moduleKey}-${item.title}`}>
                        <SidebarMenuButton
                          asChild={!item.disabled}
                          disabled={item.disabled}
                          className={`group/menu-button font-medium gap-3 h-9 rounded-md bg-gradient-to-r hover:bg-transparent hover:from-sidebar-accent hover:to-sidebar-accent/40 data-[active=true]:from-primary/20 data-[active=true]:to-primary/5 [&>svg]:size-auto ${item.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                          isActive={isActive}
                        >
                          {item.disabled ? (
                            <div className="flex items-center w-full">
                              {item.icon && (
                                <item.icon
                                  className="text-muted-foreground/60 group-data-[active=true]/menu-button:text-primary"
                                  size={22}
                                  aria-hidden="true"
                                />
                              )}
                              <span>{item.title}</span>
                              <span className="ml-auto text-xs text-muted-foreground">Bientôt</span>
                            </div>
                          ) : (
                            <Link href={item.url} aria-current={isActive ? "page" : undefined}>
                              {item.icon && (
                                <item.icon
                                  className="text-muted-foreground/60 group-data-[active=true]/menu-button:text-primary"
                                  size={22}
                                  aria-hidden="true"
                                />
                              )}
                              <span>{item.title}</span>
                            </Link>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
        {/* Settings toujours visible */}
        <SidebarGroup>
          <SidebarGroupLabel className="uppercase text-muted-foreground/60">
            Paramètres
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="group/menu-button font-medium gap-3 h-9 rounded-md bg-gradient-to-r hover:bg-transparent hover:from-sidebar-accent hover:to-sidebar-accent/40 data-[active=true]:from-primary/20 data-[active=true]:to-primary/5 [&>svg]:size-auto"
                  isActive={pathname === "/dashboard/settings"}
                >
                  <Link href="/dashboard/settings" aria-current={pathname === "/dashboard/settings" ? "page" : undefined}>
                    <RiSettings3Line
                      className="text-muted-foreground/60 group-data-[active=true]/menu-button:text-primary"
                      size={22}
                      aria-hidden="true"
                    />
                    <span>Paramètres</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <hr className="border-t border-border mx-2 -mt-px" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} disabled={signingOut} className="font-medium gap-3 h-9 rounded-md bg-gradient-to-r hover:bg-transparent hover:from-sidebar-accent hover:to-sidebar-accent/40 data-[active=true]:from-primary/20 data-[active=true]:to-primary/5 [&>svg]:size-auto cursor-pointer">
              <RiLogoutBoxLine
                className="text-muted-foreground/60 group-data-[active=true]/menu-button:text-primary"
                size={22}
                aria-hidden="true"
              />
              <span>{signingOut ? "Déconnexion..." : "Déconnexion"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
