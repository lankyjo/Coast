"use client";

import { useEffect, useState } from "react";
import {
    Bell,
    CheckCheck,
    MessageSquare,
    UserPlus,
    AlertTriangle,
    FileText,
    Filter,
} from "lucide-react";
import { useNotificationStore } from "@/stores/notification.store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

const typeIcons: Record<string, React.ReactNode> = {
    task_assigned: <MessageSquare className="h-5 w-5 text-blue-500" />,
    task_completed: <CheckCheck className="h-5 w-5 text-green-500" />,
    deadline_warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    eod_report: <FileText className="h-5 w-5 text-purple-500" />,
    member_joined: <UserPlus className="h-5 w-5 text-teal-500" />,
};

const typeLabels: Record<string, string> = {
    task_assigned: "Task Assigned",
    task_completed: "Task Completed",
    deadline_warning: "Deadline Warning",
    eod_report: "EOD Report",
    member_joined: "Member Joined",
};

function formatDate(dateString: string | Date): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
}

type FilterType = "all" | "unread";

export default function NotificationsPage() {
    const {
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
    } = useNotificationStore();

    const [filter, setFilter] = useState<FilterType>("all");

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const filteredNotifications =
        filter === "unread"
            ? notifications.filter((n) => !n.read)
            : notifications;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-sm text-muted-foreground">
                        {unreadCount > 0
                            ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                            : "You're all caught up!"}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAllAsRead()}
                        >
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Mark all read
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 rounded-lg bg-muted p-1 w-fit">
                <button
                    className={cn(
                        "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                        filter === "all"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setFilter("all")}
                >
                    All
                </button>
                <button
                    className={cn(
                        "px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5",
                        filter === "unread"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setFilter("unread")}
                >
                    Unread
                    {unreadCount > 0 && (
                        <Badge
                            variant="secondary"
                            className="h-5 min-w-5 px-1 text-xs"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </button>
            </div>

            {/* Notification List */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className="h-20 rounded-xl bg-muted animate-pulse"
                        />
                    ))}
                </div>
            ) : filteredNotifications.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <Bell className="h-12 w-12 mb-4 opacity-30" />
                        <h3 className="text-lg font-medium mb-1">
                            {filter === "unread"
                                ? "No unread notifications"
                                : "No notifications yet"}
                        </h3>
                        <p className="text-sm">
                            {filter === "unread"
                                ? "You've read all your notifications!"
                                : "When things happen, you'll see them here."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {filteredNotifications.map((notification) => (
                        <Card
                            key={notification._id?.toString()}
                            className={cn(
                                "transition-colors cursor-pointer hover:bg-muted/50",
                                !notification.read && "border-l-2 border-l-blue-500 bg-accent/5"
                            )}
                            onClick={() => {
                                if (!notification.read) {
                                    markAsRead(notification._id?.toString());
                                }
                            }}
                        >
                            <CardContent className="flex items-start gap-4 p-4">
                                <div className="mt-0.5 shrink-0 rounded-lg bg-muted p-2">
                                    {typeIcons[notification.type] || (
                                        <Bell className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <p
                                            className={cn(
                                                "text-sm leading-tight",
                                                !notification.read
                                                    ? "font-semibold text-foreground"
                                                    : "text-foreground"
                                            )}
                                        >
                                            {notification.title}
                                        </p>
                                        <Badge
                                            variant="outline"
                                            className="shrink-0 text-[10px] capitalize"
                                        >
                                            {typeLabels[notification.type] || notification.type}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground/60">
                                        {formatDate(notification.createdAt)}
                                    </p>
                                </div>
                                {!notification.read && (
                                    <div className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-500" />
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
