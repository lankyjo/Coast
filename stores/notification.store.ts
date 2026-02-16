import { create } from "zustand";
import { INotification } from "@/models/notification.model";
import {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
} from "@/actions/notification.actions";

interface NotificationState {
    notifications: INotification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchNotifications: (unreadOnly?: boolean) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    addNotification: (notification: INotification) => void; // For real-time updates
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,

    fetchNotifications: async (unreadOnly = false) => {
        set({ isLoading: true, error: null });
        try {
            const result = await getUserNotifications(unreadOnly);
            if (result.success && result.data) {
                // Calculate unread count (assuming API returns strictly what we asked, but safe to filter)
                // If we fetched ALL, we count unreads. If we fetched unreadOnly, length is the count.
                // Better strategy: Always store all recent notifications, and calculate derived unread count.

                const notifications = result.data;
                const unreadCount = notifications.filter((n: INotification) => !n.read).length;

                set({ notifications, unreadCount });
            } else {
                set({ error: result.error || "Failed to fetch notifications" });
            }
        } catch (error) {
            set({ error: "An unexpected error occurred" });
        } finally {
            set({ isLoading: false });
        }
    },

    markAsRead: async (id) => {
        // Optimistic update
        set((state) => {
            const updatedNotifications = state.notifications.map((n) =>
                n._id.toString() === id ? { ...n, read: true } : n
            );
            const unreadCount = updatedNotifications.filter((n) => !n.read).length;
            return { notifications: updatedNotifications as INotification[], unreadCount };
        });

        try {
            await markAsRead(id);
        } catch (error) {
            // Revert if failed (optional, but good practice)
            // For notifications, mostly fire-and-forget is fine for now
            console.error("Failed to mark notification as read", error);
        }
    },

    markAllAsRead: async () => {
        // Optimistic update
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })) as INotification[],
            unreadCount: 0,
        }));

        try {
            await markAllAsRead();
        } catch (error) {
            console.error("Failed to mark all notifications as read", error);
        }
    },

    addNotification: (notification) => {
        set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: state.unreadCount + 1,
        }));
    },
}));
