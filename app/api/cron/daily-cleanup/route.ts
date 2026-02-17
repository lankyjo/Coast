import { NextResponse } from "next/server";
import { Notification } from "@/models/notification.model";
import { Activity } from "@/models/activity.model";
import { Task } from "@/models/task.model";
import { connectDB } from "@/lib/db";
import { getDaysAgoWAT } from "@/lib/wat-timezone";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        // Optional: protect with a secret
        const secret = req.headers.get("x-cron-secret");
        if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectDB();

        // 1. Clear read notifications
        const notifResult = await Notification.deleteMany({ read: true });

        // 2. Clear all activity
        const activityResult = await Activity.deleteMany({});

        // 3. Delete done tasks older than 7 days
        const sevenDaysAgo = getDaysAgoWAT(7);
        const taskResult = await Task.deleteMany({
            status: "done",
            updatedAt: { $lt: sevenDaysAgo },
        });

        return NextResponse.json({
            success: true,
            results: {
                notifications: notifResult.deletedCount,
                activities: activityResult.deletedCount,
                staleTasks: taskResult.deletedCount,
            },
        });
    } catch (error: any) {
        console.error("Daily cleanup failed:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
