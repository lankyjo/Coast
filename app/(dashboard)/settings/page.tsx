"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { authClient } from "@/lib/auth-client";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import {
    Settings,
    Trash2,
    Bell,
    Activity,
    CheckCircle,
    Loader2,
    ShieldAlert,
    User,
    Lock,
    Save,
} from "lucide-react";
import { toast } from "sonner";
import {
    clearReadNotifications,
    clearAllActivity,
    clearStaleDoneTasks,
} from "@/actions/settings.actions";

type CleanupAction = "notifications" | "activity" | "staleTasks";

export default function SettingsPage() {
    const { user, setUser } = useAuthStore();
    const isAdmin = user?.role === "admin";

    // Profile form
    const [name, setName] = useState(user?.name || "");
    const [email, setEmail] = useState(user?.email || "");
    const [profileLoading, setProfileLoading] = useState(false);

    // Password form
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Admin cleanup
    const [cleanupLoading, setCleanupLoading] = useState<CleanupAction | null>(null);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileLoading(true);

        try {
            const { error } = await authClient.updateUser({
                name,
                // email, // Better Auth typically requires email verification for email changes
            });

            if (error) {
                toast.error(error.message || "Failed to update profile");
            } else {
                // Update local store
                if (user) {
                    setUser({ ...user, name });
                }
                toast.success("Profile updated successfully");
            }
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setProfileLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        setPasswordLoading(true);

        try {
            const { error } = await authClient.changePassword({
                currentPassword,
                newPassword,
            });

            if (error) {
                toast.error(error.message || "Failed to change password");
            } else {
                toast.success("Password changed successfully");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            }
        } catch {
            toast.error("An unexpected error occurred");
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleCleanup = async (action: CleanupAction) => {
        setCleanupLoading(action);
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
            setCleanupLoading(null);
        }
    };

    const cleanupItems = [
        {
            key: "notifications" as CleanupAction,
            icon: Bell,
            title: "Clear Read Notifications",
            description:
                "Permanently delete all notifications that have already been read.",
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
                "Delete all activity feed entries. New activity will start fresh.",
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
                "Remove tasks marked as done over 7 days ago.",
            buttonLabel: "Delete Stale Tasks",
            confirmTitle: "Delete stale done tasks?",
            confirmDescription:
                "This will permanently delete all tasks with status 'done' that were last updated more than 7 days ago.",
        },
    ];

    return (
        <div className="space-y-8 max-w-2xl">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10">
                    <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Settings</h1>
                    <p className="text-xs text-muted-foreground">
                        Manage your account and preferences
                    </p>
                </div>
            </div>

            {/* Profile Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Profile
                    </CardTitle>
                    <CardDescription>
                        Update your name and email address
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your name"
                                required
                                minLength={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                disabled
                                className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">
                                Contact an admin to change your email address.
                            </p>
                        </div>
                        <Button type="submit" disabled={profileLoading || name === user?.name}>
                            {profileLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Save Changes
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Password Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Change Password
                    </CardTitle>
                    <CardDescription>
                        Update your password to keep your account secure
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                        >
                            {passwordLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Lock className="mr-2 h-4 w-4" />
                            )}
                            Change Password
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Admin Danger Zone */}
            {isAdmin && (
                <>
                    <Separator />
                    <Card className="border-destructive/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-destructive">
                                <Trash2 className="h-4 w-4" />
                                Danger Zone
                            </CardTitle>
                            <CardDescription>
                                Admin-only actions. These permanently delete data.
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
                                                disabled={cleanupLoading !== null}
                                            >
                                                {cleanupLoading === item.key ? (
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
                </>
            )}
        </div>
    );
}
