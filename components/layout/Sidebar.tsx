"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import {
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    Bell,
    LogOut,
    UserPlus,
    Settings,
    PanelLeftClose,
    PanelLeft,
    ClipboardList,
} from "lucide-react";
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth.store";
import { useUIStore } from "@/stores/ui.store";
import { useNotificationStore } from "@/stores/notification.store";
import { authClient } from "@/lib/auth-client";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

const NAV_ITEMS = [
    {
        label: "Overview",
        href: "/overview",
        icon: ClipboardList,
    },
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Projects",
        href: "/projects",
        icon: FolderKanban,
    },
    {
        label: "Tasks",
        href: "/tasks",
        icon: CheckSquare,
    },
    {
        label: "Notifications",
        href: "/notifications",
        icon: Bell,
        showBadge: true,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { user } = useAuthStore();
    const { unreadCount } = useNotificationStore();
    const { isSidebarCollapsed, toggleSidebar, isMobileSheetOpen, setMobileSheetOpen } = useUIStore();

    const handleLogout = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    window.location.href = "/login";
                },
            },
        });
    };

    // Shared nav content — adapts to collapsed state
    const NavItems = ({ collapsed }: { collapsed: boolean }) => (
        <nav className="grid gap-1 px-2 text-sm font-medium">
            {NAV_ITEMS.map((item, index) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const linkContent = (
                    <Link
                        key={index}
                        href={item.href}
                        onClick={() => setMobileSheetOpen(false)}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:text-primary",
                            isActive
                                ? "bg-muted text-primary"
                                : "text-muted-foreground hover:bg-muted",
                            collapsed && "justify-center px-2"
                        )}
                    >
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                        {!collapsed && item.showBadge && unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]">
                                {unreadCount}
                            </Badge>
                        )}
                        {collapsed && item.showBadge && unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] text-destructive-foreground">
                                {unreadCount}
                            </span>
                        )}
                    </Link>
                );

                if (collapsed) {
                    return (
                        <Tooltip key={index}>
                            <TooltipTrigger asChild>
                                <div className="relative">{linkContent}</div>
                            </TooltipTrigger>
                            <TooltipContent side="right">{item.label}</TooltipContent>
                        </Tooltip>
                    );
                }
                return linkContent;
            })}
        </nav>
    );

    const WorkspaceItems = ({ collapsed }: { collapsed: boolean }) => (
        <div className="px-2 text-sm font-medium">
            {!collapsed && (
                <div className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Workspace
                </div>
            )}
            {user?.role === "admin" && (
                collapsed ? (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link
                                href="/admin"
                                className="flex items-center justify-center rounded-lg px-2 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                            >
                                <UserPlus className="h-4 w-4" />
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">Admin</TooltipContent>
                    </Tooltip>
                ) : (
                    <Link
                        href="/admin"
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                    >
                        <UserPlus className="h-4 w-4" />
                        Team
                    </Link>
                )
            )}
            {collapsed ? (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link
                            href="/settings"
                            className="flex items-center justify-center rounded-lg px-2 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                        >
                            <Settings className="h-4 w-4" />
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">Settings</TooltipContent>
                </Tooltip>
            ) : (
                <Link
                    href="/settings"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                >
                    <Settings className="h-4 w-4" />
                    Settings
                </Link>
            )}
        </div>
    );

    const UserSection = ({ collapsed }: { collapsed: boolean }) => (
        <div className="border-t p-3">
            {collapsed ? (
                <div className="flex flex-col items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Avatar className="h-8 w-8 cursor-default">
                                <AvatarImage src={user?.image} alt={user?.name} />
                                <AvatarFallback className="text-xs">{user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                            </Avatar>
                        </TooltipTrigger>
                        <TooltipContent side="right">{user?.name}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleLogout}>
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Logout</TooltipContent>
                    </Tooltip>
                </div>
            ) : (
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.image} alt={user?.name} />
                        <AvatarFallback className="text-xs">{user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden min-w-0">
                        <span className="truncate text-sm font-medium">{user?.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 shrink-0" onClick={handleLogout}>
                        <LogOut className="h-4 w-4" />
                        <span className="sr-only">Logout</span>
                    </Button>
                </div>
            )}
        </div>
    );

    return (
        <TooltipProvider delayDuration={0}>
            {/* Desktop Sidebar */}
            <div
                className={cn(
                    "hidden border-r bg-muted/40 md:flex md:flex-col h-screen sticky top-0 shrink-0 transition-all duration-300",
                    isSidebarCollapsed ? "w-[60px]" : "w-64"
                )}
            >
                {/* Logo + Collapse Toggle */}
                <div className={cn(
                    "flex h-14 items-center border-b shrink-0",
                    isSidebarCollapsed ? "justify-center px-2" : "justify-between px-4"
                )}>
                    {!isSidebarCollapsed && (
                        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                            <span className="text-xl font-bold tracking-tight text-primary">Coast</span>
                        </Link>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={toggleSidebar}>
                        {isSidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                        <span className="sr-only">Toggle sidebar</span>
                    </Button>
                </div>

                {/* Nav — scrollable */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden py-3">
                    <NavItems collapsed={isSidebarCollapsed} />
                    <Separator className="my-3 mx-2 w-auto" />
                    <WorkspaceItems collapsed={isSidebarCollapsed} />
                </div>

                {/* User section — pinned to bottom */}
                <UserSection collapsed={isSidebarCollapsed} />
            </div>

            {/* Mobile Sidebar (Sheet) */}
            <Sheet open={isMobileSheetOpen} onOpenChange={setMobileSheetOpen}>
                <SheetContent side="left" className="p-0 w-64" showCloseButton={false}>
                    <SheetTitle className="sr-only">Navigation</SheetTitle>
                    <div className="flex h-full flex-col">
                        <div className="flex h-14 items-center border-b px-4 shrink-0">
                            <Link href="/dashboard" className="flex items-center gap-2 font-semibold" onClick={() => setMobileSheetOpen(false)}>
                                <span className="text-xl font-bold tracking-tight text-primary">Coast</span>
                            </Link>
                        </div>
                        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3">
                            <NavItems collapsed={false} />
                            <Separator className="my-3 mx-2 w-auto" />
                            <WorkspaceItems collapsed={false} />
                        </div>
                        <UserSection collapsed={false} />
                    </div>
                </SheetContent>
            </Sheet>
        </TooltipProvider>
    );
}
