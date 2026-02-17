"use client";

import { useEffect } from "react";
import { useNotificationStore } from "@/stores/notification.store";
import { pusherClient } from "@/lib/pusher-client";
import { useSession } from "@/lib/auth-client";
import { INotification } from "@/models/notification.model";

export function useNotifications() {
    const { fetchNotifications, addNotification } = useNotificationStore();
    const { data: session } = useSession();

    useEffect(() => {
        // Initial fetch of all notifications
        if (session?.user) {
            fetchNotifications();
        }
    }, [fetchNotifications, session?.user]);

    useEffect(() => {
        if (!session?.user?.id) return;

        const channelName = `private-user-${session.user.id}`;
        const channel = pusherClient.subscribe(channelName);

        channel.bind("notification:new", (data: INotification) => {
            // Add notification to store (which handles deduplication)
            addNotification(data);
        });

        // Cleanup
        return () => {
            channel.unbind("notification:new");
            pusherClient.unsubscribe(channelName);
        };
    }, [session?.user?.id, addNotification]);
}
