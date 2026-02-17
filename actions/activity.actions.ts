"use server";

import { connectDB } from "@/lib/db";
import { Activity, ActivityAction } from "@/models/activity.model";
import { requireAuth } from "./auth.actions";
import "@/models/user.model"; // Register User schema for populate()

export async function logActivity(
    userId: string,
    projectId: string | undefined, // Project ID is optional (e.g., user profile changes)
    action: ActivityAction,
    description: string,
    metadata?: {
        taskId?: string;
        previousValue?: string;
        newValue?: string;
    }
) {
    try {
        await connectDB();
        await Activity.create({
            userId,
            projectId,
            action,
            description,
            metadata,
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
        // We do not throw here to prevent blocking the main action
    }
}

export async function getRecentActivity(limit = 20) {
    await requireAuth();
    await connectDB();

    const activities = await Activity.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("userId", "name email image")
        .populate("projectId", "name")
        .populate("metadata.taskId", "title")
        .lean();

    return JSON.parse(JSON.stringify(activities));
}

export async function getProjectActivity(projectId: string, limit = 20) {
    await requireAuth();
    await connectDB();

    const activities = await Activity.find({ projectId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("userId", "name email image")
        .populate("metadata.taskId", "title")
        .lean();

    return JSON.parse(JSON.stringify(activities));
}
