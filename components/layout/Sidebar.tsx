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
    Menu,
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

const NAV_ITEMS = [
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
    const { isSidebarOpen, setSidebarOpen } = useUIStore();

    const handleLogout = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    window.location.href = "/login";
                },
            },
        });
    };

    const SidebarContent = () => (
        <div className="flex h-full flex-col gap-4">
            <div className="flex h-14 items-center border-b px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                    <span className="text-xl font-bold tracking-tight text-primary">Coast</span>
                </Link>
            </div>

            <div className="flex-1 overflow-auto py-2">
                <nav className="grid gap-1 px-4 text-sm font-medium">
                    {NAV_ITEMS.map((item, index) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                    isActive
                                        ? "bg-muted text-primary"
                                        : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                                {item.showBadge && unreadCount > 0 && (
                                    <Badge variant="destructive" className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]">
                                        {unreadCount}
                                    </Badge>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <Separator className="my-4 mx-4 w-auto" />

                {/* Admin / Extra Actions */}
                <div className="px-4 text-sm font-medium">
                    <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Workspace
                    </div>
                    {user?.role === "admin" && (
                        <Link
                            href="/admin/invite"
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                            )}
                        >
                            <UserPlus className="h-4 w-4" />
                            Invite Member
                        </Link>
                    )}
                    <Link
                        href="/settings"
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
                        )}
                    >
                        <Settings className="h-4 w-4" />
                        Settings
                    </Link>
                </div>
            </div>

            <div className="mt-auto border-t p-4">
                <div className="flex items-center gap-4">
                    <Avatar>
                        <AvatarImage src={user?.image} alt={user?.name} />
                        <AvatarFallback>{user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                        <span className="truncate text-sm font-medium">{user?.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="ml-auto h-8 w-8" onClick={handleLogout}>
                        <LogOut className="h-4 w-4" />
                        <span className="sr-only">Logout</span>
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden border-r bg-muted/40 md:block w-64 shrink-0 h-screen sticky top-0">
                <SidebarContent />
            </div>

            {/* Mobile Sidebar (Sheet) */}
            <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetContent side="left" className="p-0 w-64">
                    <SidebarContent />
                </SheetContent>
            </Sheet>
        </>
    );
}
