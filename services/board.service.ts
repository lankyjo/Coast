"use server";

import { connectDB } from "@/lib/db";
import { DailyBoard, IDailyBoard } from "@/models/dailyboard.model";
import { Task, ITask } from "@/models/task.model";
import mongoose from "mongoose";
import { getTodayStartWAT, getTomorrowStartWAT } from "@/lib/wat-timezone";

/**
 * Get or create today's board (creation requires admin userId)
 * Uses WAT (UTC+1) to determine "today"
 */
export async function getOrCreateTodayBoard(
    userId: string
): Promise<IDailyBoard> {
    await connectDB();

    const todayStart = getTodayStartWAT();
    const tomorrowStart = getTomorrowStartWAT();

    let board = await DailyBoard.findOne({
        date: { $gte: todayStart, $lt: tomorrowStart },
    }).lean();

    if (!board) {
        board = await DailyBoard.create({
            date: todayStart,
            createdBy: userId,
        });
        board = JSON.parse(JSON.stringify(board));
    }

    return JSON.parse(JSON.stringify(board));
}

/**
 * Get recent boards (newest first)
 */
export async function getRecentBoards(
    limit: number = 7
): Promise<IDailyBoard[]> {
    await connectDB();

    const boards = await DailyBoard.find()
        .sort({ date: -1 })
        .limit(limit)
        .lean();

    return JSON.parse(JSON.stringify(boards));
}

/**
 * Get a board by its date (expects WAT-aligned date)
 */
export async function getBoardByDate(
    date: Date
): Promise<IDailyBoard | null> {
    await connectDB();

    // Use a date range query to match regardless of exact time
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    const board = await DailyBoard.findOne({
        date: { $gte: start, $lt: end },
    }).lean();
    if (!board) return null;
    return JSON.parse(JSON.stringify(board));
}

/**
 * Get tasks for a board, filtering private tasks based on user
 */
export async function getTasksForBoard(
    boardId: string,
    userId: string,
    userRole: string
): Promise<ITask[]> {
    await connectDB();

    const query: any = { dailyBoardId: new mongoose.Types.ObjectId(boardId) };

    // If not admin, filter out private tasks not assigned to this user
    if (userRole !== "admin") {
        query.$or = [
            { visibility: "general" },
            { visibility: { $exists: false } },
            { visibility: "private", assigneeIds: { $in: [userId] } },
        ];
    }

    const tasks = await Task.find(query)
        .sort({ createdAt: -1 })
        .lean();

    return JSON.parse(JSON.stringify(tasks));
}
