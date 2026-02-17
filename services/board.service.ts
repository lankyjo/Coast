"use server";

import { connectDB } from "@/lib/db";
import { DailyBoard, IDailyBoard } from "@/models/dailyboard.model";
import { Task, ITask } from "@/models/task.model";
import mongoose from "mongoose";

/**
 * Get or create today's board (creation requires admin userId)
 */
export async function getOrCreateTodayBoard(
    userId: string
): Promise<IDailyBoard> {
    await connectDB();

    // Use UTC date range to avoid timezone mismatches creating duplicate boards
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

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
 * Get a board by its date
 */
export async function getBoardByDate(
    date: Date
): Promise<IDailyBoard | null> {
    await connectDB();

    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    const board = await DailyBoard.findOne({ date: normalizedDate }).lean();
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
        .sort({ createdAt: 1 })
        .lean();

    return JSON.parse(JSON.stringify(tasks));
}
