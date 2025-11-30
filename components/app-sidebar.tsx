"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

import { SearchForm } from "@/components/search-form";
import { TeamSwitcher } from "@/components/team-switcher";
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
import { RiSettings3Line, RiLogoutBoxLine, RiDashboardLine, RiFileTextLine, RiUserLine, RiTeamLine, RiTruckLine, RiPriceTagLine, RiShoppingBagLine, RiDatabaseLine, RiFolderOpenLine, RiGasStationLine, RiShoppingCart2Line, RiInboxArchiveLine, RiFlightTakeoffLine, RiBillLine } from "@remixicon/react";

// This is sample data.
const data = {
  teams: [
    {
      name: "AAGS",
      logo: "https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp1/logo-01_kp2j8x.png",
    },
    {
      name: "Acme Corp.",
      logo: "https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp1/logo-01_kp2j8x.png",
    },
    {
      name: "Evil Corp.",
      logo: "https://raw.githubusercontent.com/origin-space/origin-images/refs/heads/main/exp1/logo-01_kp2j8x.png",
    },
  ],
  navMain: [
    {
      title: "Navigation",
      url: "#",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: RiDashboardLine },
      ],
    },
    {
      title: "CRM",
      url: "#",
      items: [
        { title: "Devis", url: "/dashboard/sales-quotes", icon: RiFileTextLine },
        { title: "Clients", url: "/dashboard/clients", icon: RiUserLine },
        { title: "Prospects", url: "/dashboard/prospects", icon: RiTeamLine },
        { title: "Fournisseurs", url: "/dashboard/fournisseurs", icon: RiTruckLine },
        { title: "Factures", url: "/dashboard/crm/facture", icon: RiBillLine },
      ],
    },
    {
      title: "Dépôt",
      url: "#",
      items: [
        { title: "Produits", url: "/dashboard/products", icon: RiShoppingBagLine },
        { title: "Stocks", url: "/dashboard/stocks", icon: RiDatabaseLine },
        { title: "Dépôts", url: "/dashboard/depots", icon: RiFolderOpenLine },
        { title: "Tanks", url: "/dashboard/tank", icon: RiGasStationLine },
        { title: "Commandes", url: "/dashboard/commande", icon: RiShoppingCart2Line },
        { title: "Réceptions", url: "/dashboard/reception", icon: RiInboxArchiveLine },
        { title: "Livraisons", url: "/dashboard/delivery", icon: RiFlightTakeoffLine },
      ],
    },
    {
      title: "Finance",
      url: "#",
      items: [
        { title: "Build Minier", url: "/dashboard/builders", icon: RiPriceTagLine },
        { title: "Build Non Minier", url: "/dashboard/non-mining-builders", icon: RiPriceTagLine },
        { title: "Tarifs Transport", url: "/dashboard/transport-rates", icon: RiTruckLine },
        { title: "Str de Minier", url: "/dashboard/prices", icon: RiPriceTagLine },
        { title: "Str Non Minier", url: "/dashboard/non-mining-prices", icon: RiPriceTagLine },
        { title: "Build Kalemie", url: "/dashboard/build-const-kalemie", icon: RiPriceTagLine },
        { title: "Costing Kinshasa", url: "/dashboard/kinshasa-costings", icon: RiPriceTagLine },
      ],
    },
    {
      title: "Settings",
      url: "#",
      items: [
        { title: "Paramètres", url: "/dashboard/settings", icon: RiSettings3Line },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);
  const { data: session } = authClient.useSession();
  const [role, setRole] = React.useState<"ADMIN" | "COMMERCIAL" | undefined>(undefined);
  React.useEffect(() => {
    const current = (session?.user as any)?.role as "ADMIN" | "COMMERCIAL" | undefined;
    if (current) {
      setRole(current);
      return;
    }
    const email = session?.user?.email;
    if (!email) return;
    // Fallback: fetch role from API by email in case session payload lacks role
    fetch(`/api/user-role?email=${encodeURIComponent(email)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.role === "ADMIN" || data?.role === "COMMERCIAL") setRole(data.role);
      })
      .catch(() => void 0);
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

  return (
    <Sidebar {...props} className="bg-white text-neutral-900">
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        <hr className="border-t border-border mx-2 -mt-px" />
        <SearchForm className="mt-3" />
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel className="uppercase text-muted-foreground/60">
              {item.title}
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-2">
              <SidebarMenu>
                {item.items.map((child) => {
                  const isActive =
                    child.url !== "#" &&
                    (pathname === child.url || pathname.startsWith(`${child.url}/`));

                  return (
                    <SidebarMenuItem key={child.title}>
                      <SidebarMenuButton
                        asChild
                        className="group/menu-button font-medium gap-3 h-9 rounded-md bg-gradient-to-r hover:bg-transparent hover:from-sidebar-accent hover:to-sidebar-accent/40 data-[active=true]:from-primary/20 data-[active=true]:to-primary/5 [&>svg]:size-auto"
                        isActive={isActive}
                      >
                        <Link href={child.url} aria-current={isActive ? "page" : undefined}>
                          {child.icon && (
                            <child.icon
                              className="text-muted-foreground/60 group-data-[active=true]/menu-button:text-primary"
                              size={22}
                              aria-hidden="true"
                            />
                          )}
                          <span>{child.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
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
              <span>{signingOut ? "Signing out..." : "Sign Out"}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
