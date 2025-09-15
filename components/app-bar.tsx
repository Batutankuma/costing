"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import UserDropdown from "@/components/user-dropdown";
import FeedbackDialog from "@/components/feedback-dialog";
import { ActionButtons } from "@/components/action-buttons";

function toTitleCase(slug: string) {
  return slug
    .replace(/\[|\]/g, "")
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

export default function AppBar() {
  const pathname = usePathname();

  const crumbs = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const acc: { href: string; label: string }[] = [];
    let href = "";
    for (const seg of segments) {
      href += `/${seg}`;
      acc.push({ href, label: toTitleCase(seg) });
    }
    if (acc.length === 0) {
      acc.push({ href: "/", label: "Home" });
    }
    return acc;
  }, [pathname]);

  const isDashboardHome = pathname === "/dashboard";
  const isClients = pathname.startsWith("/dashboard/clients");

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-3">
      <div className="flex flex-1 items-center gap-2">
        <SidebarTrigger className="-ms-1" />
        <div className="max-lg:hidden lg:contents">
          <Separator orientation="vertical" className="me-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {crumbs.slice(0, -1).map((c, i) => (
                <BreadcrumbItem key={c.href} className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link href={c.href}>{c.label}</Link>
                  </BreadcrumbLink>
                  <BreadcrumbSeparator className="hidden md:block" />
                </BreadcrumbItem>
              ))}
              <BreadcrumbItem>
                <BreadcrumbPage>{crumbs[crumbs.length - 1].label}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
      <div className="flex gap-3 ml-auto">
        {isDashboardHome ? <ActionButtons /> : null}
        {isClients ? <FeedbackDialog /> : null}
        <UserDropdown />
      </div>
    </header>
  );
}


