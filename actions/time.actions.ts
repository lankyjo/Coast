"use server";

import { connectDB } from "@/lib/db";
import { TimeLog } from "@/models/timelog.model";
import { Task } from "@/models/task.model";
import { requireAuth } from "./auth.actions";
import { logActivity } from "./activity.actions";
import { revalidatePath } from "next/cache";

export async function startTimeEntry(taskId: string, projectId: string) {
    const session = await requireAuth();
    await connectDB();

    // Check if there's already a running timer for this user on this task
    const existing = await TimeLog.findOne({
        userId: session.user.id,
        taskId,
        endTime: { $exists: false },
    });

    if (existing) {
        throw new Error("A timer is already running for this task");
    }

    const log = await TimeLog.create({
        userId: session.user.id,
        taskId,
        projectId,
        startTime: new Date(),
        isManual: false,
    });

    revalidatePath("/dashboard");
    return JSON.parse(JSON.stringify(log));
}

export async function stopTimeEntry(logId: string) {
    const session = await requireAuth();
    await connectDB();

    const log = await TimeLog.findById(logId);
    if (!log) throw new Error("Time log not found");
    if (log.userId.toString() !== session.user.id) throw new Error("Unauthorized");
    if (log.endTime) throw new Error("Timer already stopped");

    const endTime = new Date();
    const duration = Math.round((endTime.getTime() - log.startTime.getTime()) / 1000);

    log.endTime = endTime;
    log.duration = duration;
    await log.save();

    // Rollup time to Task model
    await Task.findByIdAndUpdate(log.taskId, {
        $inc: { totalTimeSpent: duration }
    });

    // Log activity
    const task = await Task.findById(log.taskId);
    await logActivity(
        session.user.id,
        log.projectId.toString(),
        "time_logged",
        `logged ${Math.round(duration / 60)}m on task "${task?.title || "Unknown"}"`,
        { taskId: log.taskId.toString() }
    );

    revalidatePath("/dashboard");
    return JSON.parse(JSON.stringify(log));
}

export async function logManualTime(data: {
    taskId: string;
    projectId: string;
    duration: number; // in seconds
    description?: string;
    date: string;
}) {
    const session = await requireAuth();
    await connectDB();

    const log = await TimeLog.create({
        userId: session.user.id,
        taskId: data.taskId,
        projectId: data.projectId,
        startTime: new Date(data.date),
        endTime: new Date(new Date(data.date).getTime() + data.duration * 1000),
        duration: data.duration,
        description: data.description,
        isManual: true,
    });

    // Rollup time to Task model
    await Task.findByIdAndUpdate(data.taskId, {
        $inc: { totalTimeSpent: data.duration }
    });

    // Log activity
    const task = await Task.findById(data.taskId);
    await logActivity(
        session.user.id,
        data.projectId,
        "time_logged",
        `manually logged ${Math.round(data.duration / 60)}m on task "${task?.title || "Unknown"}"`,
        { taskId: data.taskId }
    );

    revalidatePath("/dashboard");
    return JSON.parse(JSON.stringify(log));
}

export async function getTaskTimeLogs(taskId: string) {
    await requireAuth();
    await connectDB();

    const logs = await TimeLog.find({ taskId })
        .sort({ startTime: -1 })
        .populate("userId", "name")
        .lean();

    return JSON.parse(JSON.stringify(logs));
}

export async function getRunningTimer(taskId: string) {
    const session = await requireAuth();
    await connectDB();

    const log = await TimeLog.findOne({
        userId: session.user.id,
        taskId,
        endTime: { $exists: false },
    }).lean();

    return JSON.parse(JSON.stringify(log));
}
