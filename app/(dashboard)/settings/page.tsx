"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Settings, Trash2, Bell, Activity, CheckCircle, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
    clearReadNotifications,
    clearAllActivity,
    clearStaleDoneTasks,
} from "@/actions/settings.actions";

type CleanupAction = "notifications" | "activity" | "staleTasks";

export default function SettingsPage() {
    const { user } = useAuthStore();
    const isAdmin = user?.role === "admin";
    const [loading, setLoading] = useState<CleanupAction | null>(null);

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 py-20 space-y-4">
                <ShieldAlert className="h-12 w-12 text-muted-foreground/50" />
                <p className="text-lg font-medium text-muted-foreground">
                    Admin access required
                </p>
                <p className="text-sm text-muted-foreground/70">
                    Only admins can access settings.
                </p>
            </div>
        );
    }

    const handleCleanup = async (action: CleanupAction) => {
        setLoading(action);
        try {
            let result;
            switch (action) {
                case "notifications":
                    result = await clearReadNotifications();
                    break;
                case "activity":
                    result = await clearAllActivity();
                    break;
                case "staleTasks":
                    result = await clearStaleDoneTasks();
                    break;
            }
            if (result.success) {
                toast.success(`Deleted ${result.deletedCount} items.`);
            } else {
                toast.error(result.error || "Failed to clean up.");
            }
        } catch {
            toast.error("An unexpected error occurred.");
        } finally {
            setLoading(null);
        }
    };

    const cleanupItems = [
        {
            key: "notifications" as CleanupAction,
            icon: Bell,
            title: "Clear Read Notifications",
            description:
                "Permanently delete all notifications that have already been read. Unread notifications will not be affected.",
            buttonLabel: "Clear Notifications",
            confirmTitle: "Clear all read notifications?",
            confirmDescription:
                "This will permanently delete all read notifications. This action cannot be undone.",
        },
        {
            key: "activity" as CleanupAction,
            icon: Activity,
            title: "Clear Recent Activity",
            description:
                "Delete all activity feed entries. New activity will start fresh after this action.",
            buttonLabel: "Clear Activity",
            confirmTitle: "Clear all activity?",
            confirmDescription:
                "This will permanently delete the entire activity log. This cannot be undone.",
        },
        {
            key: "staleTasks" as CleanupAction,
            icon: CheckCircle,
            title: "Delete Stale Done Tasks",
            description:
                "Remove tasks marked as done over 7 days ago. Active and recent tasks are untouched.",
            buttonLabel: "Delete Stale Tasks",
            confirmTitle: "Delete stale done tasks?",
            confirmDescription:
                "This will permanently delete all tasks with status 'done' that were last updated more than 7 days ago. This cannot be undone.",
        },
    ];

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10">
                    <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Settings</h1>
                    <p className="text-xs text-muted-foreground">
                        Manage storage and cleanup
                    </p>
                </div>
            </div>

            {/* Danger Zone */}
            <Card className="border-destructive/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="h-4 w-4" />
                        Danger Zone
                    </CardTitle>
                    <CardDescription>
                        These actions permanently delete data. Use carefully —
                        storage on free plans is limited.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {cleanupItems.map((item) => (
                        <div
                            key={item.key}
                            className="flex items-center justify-between rounded-lg border p-4"
                        >
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                <item.icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium">
                                        {item.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="shrink-0 ml-4"
                                        disabled={loading !== null}
                                    >
                                        {loading === item.key ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            item.buttonLabel
                                        )}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>
                                            {item.confirmTitle}
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                            {item.confirmDescription}
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() =>
                                                handleCleanup(item.key)
                                            }
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            Confirm Delete
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
