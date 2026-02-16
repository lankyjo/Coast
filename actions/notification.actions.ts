"use server";

import { requireAuth } from "./auth.actions";
import * as notificationService from "@/services/notification.service";
import { revalidatePath } from "next/cache";

export async function getUserNotifications(unreadOnly = false) {
    const session = await requireAuth();
    try {
        const notifications = await notificationService.getUserNotifications(
            session.user.id,
            unreadOnly
        );
        return { success: true, data: notifications };
    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return { error: "Failed to fetch notifications" };
    }
}

export async function markAsRead(id: string) {
    const session = await requireAuth();
    try {
        const success = await notificationService.markNotificationAsRead(
            id,
            session.user.id
        );
        if (success) {
            revalidatePath("/dashboard"); // Revalidate where notifications might be shown
            return { success: true };
        }
        return { error: "Notification not found or already read" };
    } catch (error) {
        console.error("Failed to mark notification as read:", error);
        return { error: "Failed to mark notification as read" };
    }
}

export async function markAllAsRead() {
    const session = await requireAuth();
    try {
        const success = await notificationService.markAllNotificationsAsRead(
            session.user.id
        );
        if (success) {
            revalidatePath("/dashboard");
            return { success: true };
        }
        return { success: false, message: "No unread notifications" };
    } catch (error) {
        console.error("Failed to mark all notifications as read:", error);
        return { error: "Failed to mark all notifications as read" };
    }
}
