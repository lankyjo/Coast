"use client";

import { Bell, CheckCheck, MessageSquare, UserPlus, AlertTriangle, FileText, ExternalLink } from "lucide-react";
import { useNotificationStore } from "@/stores/notification.store";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/utils/cn";
import Link from "next/link";

const typeIcons: Record<string, React.ReactNode> = {
    task_assigned: <MessageSquare className="h-4 w-4 text-blue-500" />,
    task_completed: <CheckCheck className="h-4 w-4 text-green-500" />,
    deadline_warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    eod_report: <FileText className="h-4 w-4 text-purple-500" />,
    member_joined: <UserPlus className="h-4 w-4 text-teal-500" />,
};

function timeAgo(dateString: string | Date): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
}

export function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllAsRead } =
        useNotificationStore();

    const recentNotifications = notifications.slice(0, 10);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <h4 className="text-sm font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => markAllAsRead()}
                        >
                            Mark all read
                        </Button>
                    )}
                </div>

                {/* Notification List */}
                <ScrollArea className="max-h-[320px]">
                    {recentNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-40" />
                            <p className="text-sm">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {recentNotifications.map((notification) => (
                                <button
                                    key={notification._id?.toString()}
                                    className={cn(
                                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                                        !notification.read && "bg-accent/5"
                                    )}
                                    onClick={() => {
                                        if (!notification.read) {
                                            markAsRead(notification._id?.toString());
                                        }
                                    }}
                                >
                                    <div className="mt-0.5 shrink-0">
                                        {typeIcons[notification.type] || (
                                            <Bell className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-1 min-w-0">
                                        <p
                                            className={cn(
                                                "text-sm leading-tight",
                                                !notification.read
                                                    ? "font-medium text-foreground"
                                                    : "text-muted-foreground"
                                            )}
                                        >
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground/60">
                                            {timeAgo(notification.createdAt)}
                                        </p>
                                    </div>
                                    {!notification.read && (
                                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                {notifications.length > 0 && (
                    <div className="border-t px-4 py-2">
                        <Link
                            href="/notifications"
                            className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            View all notifications
                            <ExternalLink className="h-3 w-3" />
                        </Link>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
