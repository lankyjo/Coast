"use server";

import { connectDB } from "@/lib/db";
import { Task } from "@/models/task.model";
import { TimeLog } from "@/models/timelog.model";
import { Activity } from "@/models/activity.model";
import { getTodayStartWAT, getTomorrowStartWAT } from "@/lib/wat-timezone";
import mongoose from "mongoose";

export interface UserKPIs {
    tasksDoneToday: number;
    tasksDoneThisWeek: number;
    completionRate: number; // percentage
    totalTimeSpentToday: number; // seconds
    overdueTasksCount: number;
    activeStreak: number;
}

export async function getUserKPIs(userId: string): Promise<UserKPIs> {
    await connectDB();
    const uid = new mongoose.Types.ObjectId(userId);
    const todayStart = getTodayStartWAT();
    const tomorrowStart = getTomorrowStartWAT();

    // 1. Tasks completed today
    const tasksDoneToday = await Task.countDocuments({
        assigneeIds: { $in: [uid] },
        status: "done",
        updatedAt: { $gte: todayStart, $lt: tomorrowStart },
    });

    // 2. Tasks completed this week (last 7 days)
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const tasksDoneThisWeek = await Task.countDocuments({
        assigneeIds: { $in: [uid] },
        status: "done",
        updatedAt: { $gte: weekStart },
    });

    // 3. Completion Rate
    const totalAssigned = await Task.countDocuments({
        assigneeIds: { $in: [uid] },
    });
    const totalDone = await Task.countDocuments({
        assigneeIds: { $in: [uid] },
        status: "done",
    });
    const completionRate = totalAssigned > 0 ? Math.round((totalDone / totalAssigned) * 100) : 0;

    // 4. Total Time Spent Today
    const timeLogsToday = await TimeLog.find({
        userId: uid,
        startTime: { $gte: todayStart, $lt: tomorrowStart },
    });
    const totalTimeSpentToday = timeLogsToday.reduce((acc, log) => acc + (log.duration || 0), 0);

    // 5. Overdue Tasks Count
    const now = new Date();
    const overdueTasksCount = await Task.countDocuments({
        assigneeIds: { $in: [uid] },
        status: { $ne: "done" },
        deadline: { $lt: now },
    });

    // 6. Active Streak (days with at least one task completion)
    // This is a bit more complex, let's look at last 30 days of activity
    const activityLogs = await Activity.find({
        userId: uid,
        action: "task_completed",
        createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
    }).sort({ createdAt: -1 });

    const completionDates = new Set(
        activityLogs.map((log) => {
            const date = new Date(log.createdAt);
            return date.toISOString().split("T")[0];
        })
    );

    let streak = 0;
    const checkDate = new Date(todayStart);
    // If no completion today, check from yesterday for the streak
    if (!completionDates.has(checkDate.toISOString().split("T")[0])) {
        checkDate.setDate(checkDate.getDate() - 1);
    }

    while (completionDates.has(checkDate.toISOString().split("T")[0])) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
    }

    return {
        tasksDoneToday,
        tasksDoneThisWeek,
        completionRate,
        totalTimeSpentToday,
        overdueTasksCount,
        activeStreak: streak,
    };
}
