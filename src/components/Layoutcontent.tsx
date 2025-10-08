"use client";
import { usePathname } from "next/navigation";
import React from "react";
import { SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import Navbars from "./Navbar";
import dynamic from "next/dynamic";
const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/auth")) {
    return (
      <div className="min-h-dvh w-full color-foreground bg-background">
        <main className="w-full">{children}</main>
      </div>
    );
  }
  return (
    <SidebarProvider>
      <div className="flex min-h-dvh w-full color-foreground bg-background">
        <AppSidebar />
        <div className="flex-1 min-w-0">
          <SidebarTrigger />
          <main className="w-full">
            <Navbars /> {/* now client-only */}
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
