"use server";

import { createTaskSchema, updateTaskSchema } from "@/utils/validation";
import { requireAuth } from "./auth.actions";
import * as taskService from "@/services/task.service";
import { revalidatePath } from "next/cache";

export async function createTask(formData: unknown) {
    const session = await requireAuth();

    const result = createTaskSchema.safeParse(formData);

    if (!result.success) {
        return {
            error: "Validation failed",
            details: result.error.flatten().fieldErrors,
        };
    }

    try {
        const task = await taskService.createTask(result.data as any, session.user.id);
        revalidatePath("/dashboard");
        revalidatePath(`/projects/${result.data.projectId}`);
        return { success: true, data: task };
    } catch (error) {
        console.error("Failed to create task:", error);
        return { error: "Failed to create task" };
    }
}

export async function getTasks(filters: any) {
    await requireAuth();
    try {
        const tasks = await taskService.getTasks(filters);
        return { success: true, data: tasks };
    } catch (error) {
        console.error("Failed to fetch tasks:", error);
        return { error: "Failed to fetch tasks" };
    }
}

export async function updateTask(id: string, formData: unknown) {
    await requireAuth();

    const result = updateTaskSchema.safeParse(formData);

    if (!result.success) {
        return {
            error: "Validation failed",
            details: result.error.flatten().fieldErrors,
        };
    }

    try {
        const task = await taskService.updateTask(id, result.data as any);
        if (!task) return { error: "Task not found" };

        revalidatePath(`/projects/${task.projectId}`);
        return { success: true, data: task };
    } catch (error) {
        console.error("Failed to update task:", error);
        return { error: "Failed to update task" };
    }
}

export async function addSubtask(taskId: string, title: string) {
    await requireAuth();
    try {
        const task = await taskService.addSubtask(taskId, title);
        if (!task) return { error: "Task not found" };
        revalidatePath(`/projects/${task.projectId}`);
        return { success: true, data: task };
    } catch (error) {
        console.error("Failed to add subtask:", error);
        return { error: "Failed to add subtask" };
    }
}

export async function toggleSubtask(taskId: string, subtaskId: string, done: boolean) {
    await requireAuth();
    try {
        const task = await taskService.toggleSubtask(taskId, subtaskId, done);
        if (!task) return { error: "Task not found" };
        revalidatePath(`/projects/${task.projectId}`);
        return { success: true, data: task };
    } catch (error) {
        console.error("Failed to toggle subtask:", error);
        return { error: "Failed to toggle subtask" };
    }
}

export async function deleteTask(id: string) {
    await requireAuth();
    try {
        const success = await taskService.deleteTask(id);
        if (!success) return { error: "Task not found" };
        return { success: true };
    } catch (error) {
        console.error("Failed to delete task:", error);
        return { error: "Failed to delete task" };
    }
}
