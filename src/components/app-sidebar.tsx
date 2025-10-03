"use client";
import {
  FileText,
  LayoutDashboard,
  Wrench,
  Archive,
  LogOut,
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
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { signOut, useSession } from "next-auth/react";
import { ModeToggle } from "./ui/modetoggle";
import { Button } from "./ui/button";
import { useRouter } from "next/router";
import { usePathname } from "next/navigation";

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "#",
    icon: LayoutDashboard,
  },
  {
    title: "Status",
    url: "#",
    icon: Wrench,
  },
  {
    title: "Reports",
    url: "#",
    icon: FileText,
  },
  {
    title: "Assets",
    url: "#",
    icon: Archive,
  },
];

function Navlist() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Kurufix</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
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
          <AvatarImage src={session?.user?.image ?? ""} />
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
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </SidebarFooter>
  );
}
export function AppSidebar() {
  const pathname = usePathname();
  return (
    <>
      {pathname !== "/login" && (
        <Sidebar>
          {/*  sidebar content */}
          <SidebarContent>
            <Navlist />
          </SidebarContent>
          {/*  footer */}
          <SidebarFooters />
        </Sidebar>
      )}
    </>
  );
}
