"use server";

import { createTaskSchema, updateTaskSchema } from "@/utils/validation";
import { requireAuth, requireAdmin } from "./auth.actions";
import * as taskService from "@/services/task.service";
import * as notificationService from "@/services/notification.service";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity.actions";

export async function createTask(formData: unknown) {
    try {
        const session = await requireAdmin(); // Only admins can create tasks
        const result = createTaskSchema.safeParse(formData);

        if (!result.success) {
            return {
                success: false,
                error: "Validation failed: " + Object.entries(result.error.flatten().fieldErrors)
                    .map(([field, errors]) => `${field}: ${errors?.join(", ")}`)
                    .join("; "),
                details: result.error.flatten().fieldErrors,
            };
        }

        const task = await taskService.createTask(result.data as any, session.user.id);
        revalidatePath("/dashboard");
        revalidatePath(`/projects/${result.data.projectId}`);

        // Send notifications to all assignees
        const assigneeIds = result.data.assigneeIds || [];
        for (const assigneeId of assigneeIds) {
            if (assigneeId !== session.user.id) {
                try {
                    await notificationService.createNotification({
                        userId: assigneeId,
                        type: "task_assigned",
                        title: "New task assigned to you",
                        message: `You've been assigned: "${task.title}"`,
                        metadata: {
                            taskId: task._id?.toString(),
                            projectId: result.data.projectId,
                            triggeredBy: session.user.id,
                        },
                    });
                } catch (e) {
                    console.error("Failed to send task_assigned notification:", e);
                }
            }
        }

        // Log activity
        await logActivity(
            session.user.id,
            result.data.projectId,
            "task_created",
            `created task "${task.title}"`,
            { taskId: task._id?.toString() }
        );

        return { success: true, data: task };
    } catch (error: any) {
        console.error("Failed to create task:", error);
        return { success: false, error: error.message || "Failed to create task" };
    }
}

export async function getTasks(filters: any) {
    try {
        await requireAuth();
        const tasks = await taskService.getTasks(filters);
        return { success: true, data: tasks };
    } catch (error: any) {
        console.error("Failed to fetch tasks:", error);
        return { success: false, error: error.message || "Failed to fetch tasks" };
    }
}

export async function updateTask(id: string, formData: unknown) {
    try {
        const session = await requireAuth();
        const result = updateTaskSchema.safeParse(formData);

        if (!result.success) {
            return {
                success: false,
                error: "Validation failed: " + Object.entries(result.error.flatten().fieldErrors)
                    .map(([field, errors]) => `${field}: ${errors?.join(", ")}`)
                    .join("; "),
                details: result.error.flatten().fieldErrors,
            };
        }

        // Fetch existing task for permission check
        const existingTask = await taskService.getTaskById(id);
        if (!existingTask) return { success: false, error: "Task not found" };

        // Permission Check
        if (session.user.role !== "admin") {
            const isAssignee = existingTask.assigneeIds?.some(id => id.toString() === session.user.id);
            if (!isAssignee) {
                return { success: false, error: "You can only update tasks assigned to you." };
            }

            const updates = result.data as any;
            const allowedFields = ["status"];
            const requestedFields = Object.keys(updates);
            const isOnlyStatus = requestedFields.every(field => allowedFields.includes(field));

            if (!isOnlyStatus) {
                return { success: false, error: "Members can only update task status." };
            }
        }

        const task = await taskService.updateTask(id, result.data as any);
        if (!task) return { success: false, error: "Task not found" };

        // Send task_completed notification when status changes to done
        const updates = result.data as any;
        if (updates.status === "done" && existingTask.status !== "done") {
            // Notify the admin who assigned the task
            if (existingTask.assignedBy && existingTask.assignedBy.toString() !== session.user.id) {
                try {
                    await notificationService.createNotification({
                        userId: existingTask.assignedBy.toString(),
                        type: "task_completed",
                        title: "Task completed",
                        message: `"${task.title}" has been completed by ${session.user.name || "a team member"}`,
                        metadata: {
                            taskId: id,
                            projectId: task.projectId?.toString(),
                            triggeredBy: session.user.id,
                        },
                    });
                } catch (e) {
                    console.error("Failed to send task_completed notification:", e);
                }
            }
        }

        // Send task_assigned notification when new assignees are added
        if (updates.assigneeIds && Array.isArray(updates.assigneeIds)) {
            const oldAssigneeIds = (existingTask.assigneeIds || []).map((a: any) => a.toString());
            const newlyAdded = updates.assigneeIds.filter(
                (assigneeId: string) => !oldAssigneeIds.includes(assigneeId)
            );

            for (const assigneeId of newlyAdded) {
                if (assigneeId !== session.user.id) {
                    try {
                        await notificationService.createNotification({
                            userId: assigneeId,
                            type: "task_assigned",
                            title: "New task assigned to you",
                            message: `You've been assigned: "${task.title}"`,
                            metadata: {
                                taskId: id,
                                projectId: task.projectId?.toString(),
                                triggeredBy: session.user.id,
                            },
                        });
                    } catch (e) {
                        console.error("Failed to send task_assigned notification:", e);
                    }
                }
            }
        }

        // Log status change activity
        if (updates.status && updates.status !== existingTask.status) {
            await logActivity(
                session.user.id,
                task.projectId?.toString(),
                "status_changed",
                `changed status of "${task.title}" to ${updates.status}`,
                {
                    taskId: id,
                    previousValue: existingTask.status,
                    newValue: updates.status,
                }
            );
        }

        // Log assignment activity
        if (updates.assigneeIds && Array.isArray(updates.assigneeIds)) {
            const oldAssigneeIds = (existingTask.assigneeIds || []).map((a: any) => a.toString());
            const newlyAdded = updates.assigneeIds.filter(
                (assigneeId: string) => !oldAssigneeIds.includes(assigneeId)
            );
            if (newlyAdded.length > 0) {
                await logActivity(
                    session.user.id,
                    task.projectId?.toString(),
                    "task_assigned",
                    `assigned "${task.title}" to ${newlyAdded.length} members`,
                    { taskId: id }
                );
            }
        }

        revalidatePath(`/projects/${task.projectId}`);
        revalidatePath("/dashboard");
        return { success: true, data: task };
    } catch (error: any) {
        console.error("Failed to update task:", error);
        return { success: false, error: error.message || "Failed to update task" };
    }
}

export async function addSubtask(taskId: string, title: string) {
    try {
        const session = await requireAuth();
        const existingTask = await taskService.getTaskById(taskId);
        if (!existingTask) return { success: false, error: "Task not found" };

        if (session.user.role !== "admin") {
            const isAssignee = existingTask.assigneeIds?.some((id: any) => id.toString() === session.user.id);
            if (!isAssignee) return { success: false, error: "Unauthorized" };
        }

        const task = await taskService.addSubtask(taskId, title);
        revalidatePath(`/projects/${task.projectId}`);
        return { success: true, data: task };
    } catch (error: any) {
        console.error("Failed to add subtask:", error);
        return { success: false, error: error.message || "Failed to add subtask" };
    }
}

export async function toggleSubtask(taskId: string, subtaskId: string, done: boolean) {
    try {
        const session = await requireAuth();
        const existingTask = await taskService.getTaskById(taskId);
        if (!existingTask) return { success: false, error: "Task not found" };

        if (session.user.role !== "admin") {
            const isAssignee = existingTask.assigneeIds?.some((id: any) => id.toString() === session.user.id);
            if (!isAssignee) return { success: false, error: "Unauthorized" };
        }

        const task = await taskService.toggleSubtask(taskId, subtaskId, done);
        revalidatePath(`/projects/${task.projectId}`);
        return { success: true, data: task };
    } catch (error: any) {
        console.error("Failed to toggle subtask:", error);
        return { success: false, error: error.message || "Failed to toggle subtask" };
    }
}

export async function deleteTask(id: string) {
    try {
        await requireAdmin();
        const success = await taskService.deleteTask(id);
        if (!success) return { success: false, error: "Task not found" };
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete task:", error);
        return { success: false, error: error.message || "Failed to delete task" };
    }
}
