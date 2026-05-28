"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, FileText, Users, Settings, ShoppingCart } from "lucide-react";

type Item = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const items: Item[] = [
  { href: "/dashboard", label: "Accueil", icon: Home },
  { href: "/dashboard/sales-quotes/create", label: "Devis", icon: FileText },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/commande", label: "Commandes", icon: ShoppingCart },
  { href: "/dashboard/settings", label: "Réglages", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className={
        // mobile only, hidden on md+
        "fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 pb-[max(env(safe-area-inset-bottom),0.25rem)] backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden"
      }
    >
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = pathname === it.href || (it.href !== "/dashboard" && pathname?.startsWith(it.href));
          const Icon = it.icon;
          return (
            <li key={it.href} className="flex">
              <Link
                href={it.href}
                className={cn(
                  "flex-1 flex min-h-14 flex-col items-center justify-center gap-1 py-1.5 text-[11px]",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="truncate">{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}




