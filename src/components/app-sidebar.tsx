"use client";

import {
  Archive,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  UserPen,
  UserStar,
  Wrench,
  SquarePlus,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

type MenuItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

function useRole() {
  const { data: session } = useSession();
  return (session?.user as any)?.role ?? null; // "user" | "staff" | "admin" | null
}

function BrandHeader() {
  const { state } = useSidebar();
  return (
    <div className="px-3 py-5 border-b">
      <Link
        href="/"
        className="flex items-center gap-4"
        aria-label="Kurufix Home"
      >
        <Image
          src="/sta.png"
          alt="Kurufix"
          width={80}
          height={80}
          priority
          className="rounded-full object-cover"
        />
        {state !== "collapsed" && (
          <div className="leading-none">
            <div className="text-3xl md:text-4xl font-extrabold tracking-tight">
              <span className="text-orange-500">K</span>urufix
            </div>
          </div>
        )}
      </Link>
    </div>
  );
}

function NavSection({
  label,
  items,
}: {
  label: string;
  items: MenuItem[];
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  if (!items.length) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sm md:text-base font-semibold">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.url)}
                className="text-[15px] md:text-base"
              >
                <Link href={item.url} className="gap-2">
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function Navlist() {
  const role = useRole();

  // ----- User -----
  const userItems: MenuItem[] = [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Status", url: "/status", icon: Wrench },
    { title: "Reports", url: "/reports", icon: FileText },
    { title: "Assets", url: "/assets", icon: Archive },
    { title: "Account", url: "/account", icon: Settings },
  ];

  // ----- Staff and admin tools -----
  const staffItems: MenuItem[] =
    role === "staff" || role === "admin"
      ? [{ title: "Ticket Management", url: "/staff", icon: UserStar }]
      : [];

  // ----- Admin -----
  const adminItems: MenuItem[] =
    role === "admin"
      ? [
          { title: "User Management", url: "/admin", icon: UserPen },
          { title: "Add Kurupan", url: "/addasset", icon: SquarePlus },
        ]
      : [];

  return (
    <>
      <NavSection label="User" items={userItems} />
      <NavSection label="Staff tools" items={staffItems} />
      <NavSection label="Admin" items={adminItems} />
    </>
  );
}

function SidebarFooters() {
  const { data: session } = useSession();
  const { state } = useSidebar();

  return (
    <SidebarFooter className="border-t pt-2">
      <div className="flex items-center gap-3 px-2 py-2">
        <Avatar className="h-9 w-9">
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
          <div className="min-w-0 leading-tight">
            <div className="truncate font-medium text-sm md:text-base">
              {session?.user?.name}
            </div>
            <div className="truncate text-muted-foreground text-xs md:text-sm">
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
        <BrandHeader />
        <Navlist />
      </SidebarContent>
      <SidebarFooters />
    </Sidebar>
  );
}
