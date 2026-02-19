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
 * Get tasks for a board, filtering private tasks based on user.
 * Includes:
 *  1. Tasks explicitly linked to this board via dailyBoardId
 *  2. Tasks whose deadline falls on the board's date
 *  3. Multi-day tasks that span across the board's date (created before, deadline after)
 */
export async function getTasksForBoard(
    boardId: string,
    userId: string,
    userRole: string,
    boardDate?: string
): Promise<ITask[]> {
    await connectDB();

    // Build base conditions for matching tasks to this board
    const matchConditions: any[] = [
        { dailyBoardId: new mongoose.Types.ObjectId(boardId) },
    ];

    // If we have the board's date, also include tasks whose deadline
    // falls on this day, or multi-day tasks spanning this day
    if (boardDate) {
        const dayStart = new Date(boardDate);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

        // Tasks due on this day (deadline falls within the day)
        matchConditions.push({
            deadline: { $gte: dayStart, $lt: dayEnd },
            dailyBoardId: { $ne: new mongoose.Types.ObjectId(boardId) }, // avoid double-counting
        });

        // Multi-day tasks that span across this day
        // (created before or on this day, deadline on or after this day)
        matchConditions.push({
            createdAt: { $lt: dayEnd },
            deadline: { $gte: dayStart },
            dailyBoardId: { $exists: true, $ne: new mongoose.Types.ObjectId(boardId) },
        });
    }

    const query: any = { $or: matchConditions };

    // If not admin, filter out private tasks not assigned to this user
    if (userRole !== "admin") {
        query.$and = [
            { $or: matchConditions },
            {
                $or: [
                    { visibility: "general" },
                    { visibility: { $exists: false } },
                    { visibility: "private", assigneeIds: { $in: [userId] } },
                ],
            },
        ];
        delete query.$or;
    }

    const tasks = await Task.find(query)
        .sort({ createdAt: -1 })
        .lean();

    // De-duplicate (a task could match multiple conditions)
    const seen = new Set<string>();
    const unique = tasks.filter((t) => {
        const id = t._id.toString();
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
    });

    return JSON.parse(JSON.stringify(unique));
}
