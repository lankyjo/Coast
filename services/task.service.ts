import { connectDB } from "@/lib/db";
import { Task, ITask } from "@/models/task.model";
import {
    CreateTaskInput,
    UpdateTaskInput,
    TaskFilters,
} from "@/types/task.types";
import mongoose, { SortOrder } from "mongoose";

export async function createTask(
    data: CreateTaskInput,
    userId: string
): Promise<ITask> {
    await connectDB();

    // If no dailyBoardId is provided, assign to today's board
    let boardId = data.dailyBoardId;
    if (!boardId) {
        // dynamic import to avoid circular dependency if any (though likely safe here as board service uses Task model, but Task service uses Board model... wait. board service uses Task model for getTasksForBoard. Task service uses Board model for creation? No, Board service creates Board. Task service creates Task. Circular dependency warning: board.service imports Task. task.service importing board.service might cause issues if they both run at top level. But these are functions. It should be fine?)
        // Let's use standard import.
        const { getOrCreateTodayBoard } = await import("@/services/board.service");
        const todayBoard = await getOrCreateTodayBoard(userId);
        boardId = todayBoard._id as any;
    }

    const newTask = await Task.create({
        ...data,
        dailyBoardId: boardId,
        assignedBy: userId,
        status: "todo",
        priority: data.priority,
        // AI Metadata will be populated later
        aiMetadata: {
            difficultyScore: 5, // Default
        },
        subtasks: data.subtasks || [],
        attachments: [],
        timeEntries: [],
    });

    return JSON.parse(JSON.stringify(newTask));
}

export async function getTasks(filters: TaskFilters): Promise<{
    tasks: ITask[];
    total: number;
    page: number;
    totalPages: number;
}> {
    await connectDB();

    const query: any = {};

    if (filters.status !== "all") {
        query.status = filters.status;
    }

    if (filters.priority !== "all") {
        query.priority = filters.priority;
    }

    if (filters.assignee !== "all") {
        query.assigneeIds = { $in: [filters.assignee] };
    }

    if (filters.project !== "all") {
        query.projectId = filters.project;
    }

    if (filters.search) {
        query.$or = [
            { title: { $regex: filters.search, $options: "i" } },
            { description: { $regex: filters.search, $options: "i" } },
        ];
    }

    // Due Today filter: tasks whose deadline falls within today
    if (filters.dueToday) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);
        query.deadline = { $gte: todayStart, $lt: todayEnd };
    }

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
        Task.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Task.countDocuments(query),
    ]);

    return {
        tasks: JSON.parse(JSON.stringify(tasks)),
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}

export async function getTaskById(id: string): Promise<ITask | null> {
    await connectDB();
    try {
        const task = await Task.findById(id).lean();
        if (!task) return null;
        return JSON.parse(JSON.stringify(task));
    } catch {
        return null;
    }
}

export async function updateTask(
    id: string,
    data: UpdateTaskInput
): Promise<ITask | null> {
    await connectDB();

    const task = await Task.findByIdAndUpdate(
        id,
        { $set: data },
        { returnDocument: "after", runValidators: true }
    ).lean();

    if (!task) return null;
    return JSON.parse(JSON.stringify(task));
}

export async function addSubtask(taskId: string, title: string) {
    await connectDB();
    const task = await Task.findByIdAndUpdate(
        taskId,
        {
            $push: {
                subtasks: {
                    title,
                    done: false,
                },
            },
        },
        { returnDocument: "after" }
    ).lean();
    return JSON.parse(JSON.stringify(task));
}

export async function toggleSubtask(taskId: string, subtaskId: string, done: boolean) {
    await connectDB();

    const task = await Task.findOneAndUpdate(
        { _id: taskId, "subtasks._id": subtaskId },
        {
            $set: {
                "subtasks.$.done": done,
                "subtasks.$.completedAt": done ? new Date() : null,
            },
        },
        { returnDocument: "after" }
    ).lean();

    return JSON.parse(JSON.stringify(task));
}

export async function deleteTask(id: string): Promise<boolean> {
    await connectDB();
    const result = await Task.findByIdAndDelete(id);
    return !!result;
}
