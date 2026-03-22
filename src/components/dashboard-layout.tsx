
'use client';

import Link from "next/link";
import {
  Home,
  Users,
  Settings,
  LogOut,
  TrendingUp,
  BrainCircuit,
  ArrowLeft,
  Loader2,
  User,
  BookMarked,
  Monitor,
  MessageSquare,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useMemo } from 'react';
import { useCorrectionRequests } from "@/context/correction-request-provider";

import { Button } from "@/components/ui/button";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarSeparator,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { GradeXLogo } from "./icons";
import { useUser } from "@/firebase/auth/use-user";
import { getAuth, signOut } from "firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

type DashboardLayoutProps = {
  children: React.ReactNode;
  role: "admin" | "student";
  alertCount?: number;
};

const adminNavItems = [
  { href: "/admin/dashboard", icon: Home, label: "Dashboard" },
  { href: "/admin/students", icon: Users, label: "Students" },
  { href: "/admin/monitoring", icon: Monitor, label: "Academic Monitoring" },
  { href: "/admin/correction-requests", icon: MessageSquare, label: "Correction Requests" },
  { href: "/admin/subjects", icon: BookMarked, label: "Subjects" },
  { href: "/admin/analytics", icon: TrendingUp, label: "Analytics" },
  { href: "/admin/profile", icon: User, label: "Profile" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

const studentNavItems = [
  { href: "/student/dashboard", icon: Home, label: "Dashboard" },
  { href: "/student/ai-summary", icon: BrainCircuit, label: "AI Summary" },
  { href: "/student/profile", icon: User, label: "Profile" },
];

export function DashboardLayout({ children, role, alertCount }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, userProfile } = useUser();
  const { requests } = useCorrectionRequests();

  const pendingRequestsCount = useMemo(() => {
    return requests.filter(r => r.status === 'pending').length;
  }, [requests]);

  const navItems = role === "admin" ? adminNavItems : studentNavItems;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    } else if (!isLoading && user && userProfile && userProfile.role !== role) {
      // If user is logged in but trying to access the wrong role's dashboard
      const correctDashboard = userProfile.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
      router.push(correctDashboard);
    }
  }, [isLoading, user, userProfile, role, router]);


  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    router.push("/login");
  };

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border p-4">
          <div className="flex items-center gap-2">
            <GradeXLogo className="w-8 h-8 text-primary" />
            <span className="text-xl font-semibold">GradeX</span>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-4 flex flex-col gap-4">
          {user && userProfile && (
            <div className="flex flex-col items-start gap-3 rounded-lg bg-sidebar-accent p-4 w-full overflow-hidden">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={userProfile.photoURL ?? user.photoURL ?? undefined} />
                <AvatarFallback>{userProfile.displayName?.[0] || 'A'}</AvatarFallback>
              </Avatar>
              <div className="w-full min-w-0">
                <p className="text-md font-semibold truncate">{userProfile.displayName || 'Admin'}</p>
                <p className="text-sm text-muted-foreground truncate" title={user.email || ""}>{user.email}</p>
              </div>
            </div>
          )}
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{ children: item.label }}
                >
                  <Link href={item.href} className="flex flex-1 items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon />
                      <span>{item.label}</span>
                    </div>
                    {item.href === "/student/ai-summary" && alertCount && alertCount > 0 ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-destructive px-1 text-xs font-medium text-destructive-foreground">
                        {alertCount}
                      </span>
                    ) : item.href === "/admin/correction-requests" && pendingRequestsCount > 0 ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white shadow-sm animate-pulse">
                        {pendingRequestsCount}
                      </span>
                    ) : null}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarSeparator />
        <SidebarFooter className="p-4 mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                tooltip={{ children: "Log Out" }}
                className="text-destructive dark:text-destructive-foreground/70 hover:bg-destructive/20 dark:hover:text-destructive-foreground"
              >
                <LogOut />
                <span>Log Out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <div className="flex flex-col flex-1 h-screen">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-background px-4 md:px-6 sticky top-0 z-30">
          <SidebarTrigger />
          <div className="flex-1" />
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
        </header>
        <main className="flex-1 p-4 md:p-8 flex flex-col gap-4">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
