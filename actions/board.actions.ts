"use server";

import { requireAuth, requireAdmin } from "./auth.actions";
import * as boardService from "@/services/board.service";
import * as commentService from "@/services/comment.service";
import * as taskService from "@/services/task.service";
import * as notificationService from "@/services/notification.service";
import { logActivity } from "./activity.actions";
import { revalidatePath } from "next/cache";

/**
 * Get or create today's board.
 * Any authenticated user can view; auto-creation happens for admin.
 */
export async function getOrCreateTodayBoard() {
    try {
        const session = await requireAuth();
        const board = await boardService.getOrCreateTodayBoard(
            session.user.id
        );
        return { success: true, data: board };
    } catch (error: any) {
        console.error("Failed to get/create today's board:", error);
        return { success: false, error: error.message || "Failed to get board" };
    }
}

/**
 * Get recent boards (last N days)
 */
export async function getRecentBoards(limit: number = 7) {
    try {
        await requireAuth();
        const boards = await boardService.getRecentBoards(limit);
        return { success: true, data: boards };
    } catch (error: any) {
        console.error("Failed to fetch boards:", error);
        return { success: false, error: error.message || "Failed to fetch boards" };
    }
}

/**
 * Get tasks for a specific board
 */
export async function getBoardTasks(boardId: string) {
    try {
        const session = await requireAuth();
        const tasks = await boardService.getTasksForBoard(
            boardId,
            session.user.id,
            (session.user as any).role || "member"
        );
        return { success: true, data: tasks };
    } catch (error: any) {
        console.error("Failed to fetch board tasks:", error);
        return {
            success: false,
            error: error.message || "Failed to fetch board tasks",
        };
    }
}

/**
 * Add a task to a board (admin only)
 */
export async function addTaskToBoard(
    boardId: string,
    taskData: {
        title: string;
        description: string;
        projectId: string;
        assigneeIds?: string[];
        priority: string;
        visibility?: "general" | "private";
        deadline?: string;
    }
) {
    try {
        const session = await requireAdmin();

        const task = await taskService.createTask(
            {
                ...taskData,
                dailyBoardId: boardId,
                visibility: taskData.visibility || "general",
            } as any,
            session.user.id
        );

        // Send notifications to assignees
        const assigneeIds = taskData.assigneeIds || [];
        for (const assigneeId of assigneeIds) {
            if (assigneeId !== session.user.id) {
                try {
                    await notificationService.createNotification({
                        userId: assigneeId,
                        type: "task_assigned",
                        title: "New task assigned to you",
                        message: `You've been assigned: "${taskData.title}" on today's board`,
                        metadata: {
                            taskId: task._id?.toString(),
                            projectId: taskData.projectId,
                            triggeredBy: session.user.id,
                        },
                    });
                } catch (e) {
                    console.error("Failed to send notification:", e);
                }
            }
        }

        // Log activity
        await logActivity(
            session.user.id,
            taskData.projectId,
            "task_created",
            `added "${taskData.title}" to daily board`,
            { taskId: task._id?.toString() }
        );

        revalidatePath("/overview");
        return { success: true, data: task };
    } catch (error: any) {
        console.error("Failed to add task to board:", error);
        return {
            success: false,
            error: error.message || "Failed to add task to board",
        };
    }
}

/**
 * Toggle task done status.
 * Only assignees and admins can toggle.
 */
export async function toggleBoardTaskDone(taskId: string) {
    try {
        const session = await requireAuth();
        const existingTask = await taskService.getTaskById(taskId);
        if (!existingTask) return { success: false, error: "Task not found" };

        const isAdmin = session.user.role === "admin";
        const isAssignee = existingTask.assigneeIds?.some(
            (id: any) => id.toString() === session.user.id
        );

        if (!isAdmin && !isAssignee) {
            return {
                success: false,
                error: "Only assigned members and admins can mark tasks as done",
            };
        }

        const newStatus = existingTask.status === "done" ? "todo" : "done";
        const task = await taskService.updateTask(taskId, {
            status: newStatus,
        } as any);

        if (!task) return { success: false, error: "Failed to update task" };

        // Log activity
        if (newStatus === "done") {
            await logActivity(
                session.user.id,
                task.projectId?.toString(),
                "task_completed",
                `completed "${task.title}"`,
                { taskId }
            );
        }

        revalidatePath("/overview");
        return { success: true, data: task };
    } catch (error: any) {
        console.error("Failed to toggle task done:", error);
        return {
            success: false,
            error: error.message || "Failed to toggle task",
        };
    }
}

/**
 * Add a comment to a task (any authenticated user)
 */
export async function addCommentAction(
    taskId: string,
    text: string,
    taggedUserIds: string[] = []
) {
    try {
        const session = await requireAuth();
        const comment = await commentService.addComment(
            taskId,
            session.user.id,
            text,
            taggedUserIds
        );

        // Notify tagged users
        for (const taggedId of taggedUserIds) {
            if (taggedId !== session.user.id) {
                try {
                    await notificationService.createNotification({
                        userId: taggedId,
                        type: "info",
                        title: "You were mentioned in a comment",
                        message: `${session.user.name || "Someone"} mentioned you in a comment`,
                        metadata: {
                            taskId,
                            triggeredBy: session.user.id,
                        },
                    });
                } catch (e) {
                    console.error("Failed to send mention notification:", e);
                }
            }
        }

        revalidatePath("/overview");
        return { success: true, data: comment };
    } catch (error: any) {
        console.error("Failed to add comment:", error);
        return {
            success: false,
            error: error.message || "Failed to add comment",
        };
    }
}

/**
 * Get comments for a task
 */
export async function getCommentsForTask(taskId: string) {
    try {
        await requireAuth();
        const comments = await commentService.getComments(taskId);
        return { success: true, data: comments };
    } catch (error: any) {
        console.error("Failed to fetch comments:", error);
        return {
            success: false,
            error: error.message || "Failed to fetch comments",
        };
    }
}

/**
 * Delete a task from the board (admin only)
 */
export async function deleteBoardTask(taskId: string) {
    try {
        await requireAdmin();
        const success = await taskService.deleteTask(taskId);
        if (!success) return { success: false, error: "Task not found" };

        revalidatePath("/overview");
        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete board task:", error);
        return { success: false, error: error.message || "Failed to delete task" };
    }
}
