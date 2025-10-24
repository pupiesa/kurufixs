"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Archive,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  UserStar,
  Wrench,
  UserPen,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import { ModeToggle } from "./ui/modetoggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type MenuItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

function Navlist() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role ?? null;

  const items: MenuItem[] = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Status", url: "/status", icon: Wrench },
    { title: "Reports", url: "/reports", icon: FileText },
    { title: "Assets", url: "/assets", icon: Archive },
    { title: "Account", url: "/account", icon: Settings },
  ];
  // staff sidebar nav list
  if (role === "staff" || role === "admin") {
    // items.splice(2, 1);
    // items.splice(1, 1);
    items.push({ title: "Ticket Management", url: "/staff", icon: UserStar });
  }
  if (role === "admin") {
    items.push({ title: "Admin Panel", url: "/admin", icon: UserPen });
  }
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Kurufix</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function SidebarFooters() {
  const { data: session } = useSession();
  const { state } = useSidebar();
  return (
    <SidebarFooter className="border-t pt-2">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={session?.user?.image ?? ""}
            className="rounded-full object-cover"
            alt={session?.user?.name ?? "User"}
          />
          <AvatarFallback>
            {session?.user?.name?.charAt(0) ?? "U"}
          </AvatarFallback>
        </Avatar>
        {state !== "collapsed" && (
          <div className="min-w-0 text-xs leading-tight">
            <div className="truncate font-medium text-sm">
              {session?.user?.name}
            </div>
            <div className="truncate text-muted-foreground">
              {session?.user?.email}
            </div>
          </div>
        )}
        <ModeToggle />
      </div>
      <div className="px-2 pb-2">
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => signOut({ redirectTo: "/auth" })}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </SidebarFooter>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  if (pathname.startsWith("/auth")) return null;

  return (
    <Sidebar>
      <SidebarContent>
        <Navlist />
      </SidebarContent>
      <SidebarFooters />
    </Sidebar>
  );
}
