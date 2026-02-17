import { connectDB } from "@/lib/db";
import { Notification, INotification } from "@/models/notification.model";
import { NotificationType } from "@/types/notification.types";
import { pusherServer } from "@/lib/pusher";

export interface CreateNotificationInput {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: {
        taskId?: string;
        projectId?: string;
        triggeredBy?: string;
    };
}

export async function createNotification(
    data: CreateNotificationInput
): Promise<INotification> {
    await connectDB();

    const notification = await Notification.create({
        ...data,
        read: false,
    });

    // Trigger Pusher event for real-time update
    try {
        // We use a private channel for each user: private-user-{userId}
        await pusherServer.trigger(
            `private-user-${data.userId}`,
            "notification:new",
            notification
        );
    } catch (error) {
        console.error("Failed to trigger Pusher event:", error);
    }

    return JSON.parse(JSON.stringify(notification));
}

export async function getUserNotifications(
    userId: string,
    unreadOnly = false
): Promise<INotification[]> {
    await connectDB();

    const query: any = { userId };
    if (unreadOnly) {
        query.read = false;
    }

    const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(50) // Limit to last 50 notifications
        .lean();

    return JSON.parse(JSON.stringify(notifications));
}

export async function markNotificationAsRead(
    id: string,
    userId: string
): Promise<boolean> {
    await connectDB();

    const result = await Notification.updateOne(
        { _id: id, userId },
        { $set: { read: true } }
    );

    return result.modifiedCount > 0;
}

export async function markAllNotificationsAsRead(
    userId: string
): Promise<boolean> {
    await connectDB();

    const result = await Notification.updateMany(
        { userId, read: false },
        { $set: { read: true } }
    );

    return result.modifiedCount > 0;
}
