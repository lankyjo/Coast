"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { useNotificationStore } from "@/stores/notification.store";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, setUser, setLoading } = useAuthStore();
    const { fetchNotifications } = useNotificationStore();

    // Hydrate auth/user on mount
    useEffect(() => {
        const init = async () => {
            if (!user) {
                const { data } = await authClient.getSession();
                if (data?.user) {
                    // We need to cast or ensure data.user matches our session user type
                    // It mostly should, but flexible
                    setUser({
                        id: data.user.id,
                        name: data.user.name,
                        email: data.user.email,
                        image: data.user.image || undefined,
                        role: (data.user as any).role, // If extended
                    });

                    // Fetch notifications once user is confirmed
                    fetchNotifications();
                } else {
                    setLoading(false); // No user found
                }
            }
        };
        init();
    }, [user, setUser, setLoading, fetchNotifications]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // If strict auth required, we might redirect here or handle in page/middleware.
    // Assuming Middleware handles protection, layout just renders.

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40 md:flex-row">
            <Sidebar />
            <div className="flex flex-col flex-1 min-h-screen">
                <Header />
                <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
