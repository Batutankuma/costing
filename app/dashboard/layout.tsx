
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { AppSidebar } from "@/components/app-sidebar";
import AppBar from "@/components/app-bar";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import AuthGuard from "@/components/auth-guard";
import BottomNav from "@/components/bottom-nav";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="px-0 md:px-6 lg:px-8 bg-white text-neutral-900">
        <AuthGuard>
          <AppBar />
          <div className="p-0">
            {children}
          </div>
          {/* Mobile bottom navigation */}
          <BottomNav />
        </AuthGuard>
      </SidebarInset>
    </SidebarProvider>
  );
}
