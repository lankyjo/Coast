"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { authClient } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/use-notifications";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, setUser, setLoading } = useAuthStore();

    // Start SSE connection and initial notification fetch
    useNotifications();

    // Hydrate auth/user on mount
    useEffect(() => {
        const init = async () => {
            if (!user) {
                const { data } = await authClient.getSession();
                if (data?.user) {
                    setUser({
                        id: data.user.id,
                        name: data.user.name,
                        email: data.user.email,
                        image: data.user.image || undefined,
                        role: (data.user as any).role,
                    });
                } else {
                    setLoading(false);
                }
            }
        };
        init();
    }, [user, setUser, setLoading]);

    if (isLoading) {
        return (
            <div className="flex min-h-dvh w-full flex-col bg-muted/40 md:flex-row">
                {/* Sidebar skeleton */}
                <div className="hidden md:flex md:flex-col h-screen w-64 border-r bg-muted/40 sticky top-0 shrink-0">
                    <div className="flex h-14 items-center border-b px-4">
                        <Skeleton className="h-7 w-20" />
                    </div>
                    <div className="flex-1 p-3 space-y-2">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-9 w-full rounded-lg" />
                        ))}
                        <div className="my-4">
                            <Skeleton className="h-px w-full" />
                        </div>
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-9 w-full rounded-lg" />
                    </div>
                    <div className="border-t p-3">
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <div className="flex-1 space-y-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main content skeleton */}
                <div className="flex flex-col flex-1 min-h-screen">
                    <div className="flex h-14 items-center border-b px-6">
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <div className="flex-1 p-4 md:p-8 space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-4 w-96" />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-28 w-full rounded-xl" />
                            ))}
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Skeleton className="h-64 w-full rounded-xl" />
                            <Skeleton className="h-64 w-full rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-dvh w-full flex-col bg-muted/40 md:flex-row overflow-hidden">
            <Sidebar />
            <div className="flex flex-col flex-1 min-h-screen min-w-0">
                <Header />
                <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 min-w-0 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
