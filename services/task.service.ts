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

    const newTask = await Task.create({
        ...data,
        assignedBy: userId,
        status: "todo",
        priority: data.priority,
        // AI metadata will be populated later
        aiMetadata: {
            difficultyScore: 5, // Default
        },
        subtasks: [],
        attachments: [],
        timeEntries: [],
    });

    return JSON.parse(JSON.stringify(newTask));
}

export async function getTasks(filters: TaskFilters): Promise<ITask[]> {
    await connectDB();

    const query: any = {};

    if (filters.status !== "all") {
        query.status = filters.status;
    }

    if (filters.priority !== "all") {
        query.priority = filters.priority;
    }

    if (filters.assignee !== "all") {
        query.assigneeId = filters.assignee;
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

    // Sort by priority (urgent first) then deadline (soonest first)
    const tasks = await Task.find(query)
        .sort({ priority: 1, deadline: 1 })
        .lean();

    return JSON.parse(JSON.stringify(tasks));
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
