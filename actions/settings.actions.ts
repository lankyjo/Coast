"use server";

import { requireAdmin } from "./auth.actions";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/notification.model";
import { Activity } from "@/models/activity.model";
import { Task } from "@/models/task.model";
import { getDaysAgoWAT } from "@/lib/wat-timezone";

/**
 * Clear all read notifications
 */
export async function clearReadNotifications() {
    try {
        await requireAdmin();
        await connectDB();
        const result = await Notification.deleteMany({ read: true });
        return { success: true, deletedCount: result.deletedCount };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to clear notifications" };
    }
}

/**
 * Clear all activity entries
 */
export async function clearAllActivity() {
    try {
        await requireAdmin();
        await connectDB();
        const result = await Activity.deleteMany({});
        return { success: true, deletedCount: result.deletedCount };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to clear activity" };
    }
}

/**
 * Delete done tasks older than 7 days
 */
export async function clearStaleDoneTasks() {
    try {
        await requireAdmin();
        await connectDB();

        const sevenDaysAgo = getDaysAgoWAT(7);

        const result = await Task.deleteMany({
            status: "done",
            updatedAt: { $lt: sevenDaysAgo },
        });

        return { success: true, deletedCount: result.deletedCount };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to clear stale tasks" };
    }
}
