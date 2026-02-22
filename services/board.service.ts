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

    // If we have the board's date, also include tasks whose active date range
    // falls on this day.
    // i.e startDate <= boardDate <= deadline
    if (boardDate) {
        const dayStart = new Date(boardDate);
        dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

        // Include a task if the board's day is within its [startDate, deadline] range
        matchConditions.push({
            $and: [
                {
                    $or: [
                        { startDate: { $lte: dayEnd } },     // Has startDate and started before the end of the board day
                        { createdAt: { $lt: dayEnd }, startDate: { $exists: false } } // Fallback to createdAt if no startDate
                    ]
                },
                {
                    $or: [
                        { deadline: { $gte: dayStart } },    // Has deadline and due on or after the start of the board day
                        { deadline: { $exists: false } }     // No deadline, show indefinitely
                    ]
                }
            ],
            dailyBoardId: { $ne: new mongoose.Types.ObjectId(boardId) }, // avoid double-counting
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

/**
 * Get all uncompleted tasks from past daily boards (the virtual backlog).
 * Excludes tasks linked to today's board.
 * Filters private tasks based on user role.
 */
export async function getBacklogTasks(
    userId: string,
    userRole: string
): Promise<ITask[]> {
    await connectDB();

    const todayStart = getTodayStartWAT();

    // Find all board IDs for days before today
    const pastBoards = await DailyBoard.find({
        date: { $lt: todayStart },
    })
        .select("_id")
        .lean();

    const pastBoardIds = pastBoards.map((b) => b._id);

    if (pastBoardIds.length === 0) return [];

    const query: any = {
        dailyBoardId: { $in: pastBoardIds },
        status: { $ne: "done" },
    };

    // Filter private tasks for non-admin users
    if (userRole !== "admin") {
        query.$and = [
            { dailyBoardId: { $in: pastBoardIds }, status: { $ne: "done" } },
            {
                $or: [
                    { visibility: "general" },
                    { visibility: { $exists: false } },
                    { visibility: "private", assigneeIds: { $in: [userId] } },
                ],
            },
        ];
        delete query.dailyBoardId;
        delete query.status;
    }

    const tasks = await Task.find(query)
        .sort({ priority: -1, deadline: 1, createdAt: -1 })
        .lean();

    return JSON.parse(JSON.stringify(tasks));
}

/**
 * Move a task from its current board to today's board ("re-board").
 * Creates today's board if it doesn't exist.
 */
export async function reboardTaskToToday(
    taskId: string,
    userId: string
): Promise<ITask | null> {
    await connectDB();

    const todayBoard = await getOrCreateTodayBoard(userId);

    const task = await Task.findByIdAndUpdate(
        taskId,
        { $set: { dailyBoardId: todayBoard._id } },
        { returnDocument: "after" }
    ).lean();

    if (!task) return null;
    return JSON.parse(JSON.stringify(task));
}
