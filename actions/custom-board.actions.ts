"use server";

import { requireAuth } from "./auth.actions";
import * as customBoardService from "@/services/custom-board.service";
import { revalidatePath } from "next/cache";

export async function createCustomBoardAction(data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
}) {
    try {
        const session = await requireAuth();
        const board = await customBoardService.createCustomBoard({
            ...data,
            createdBy: session.user.id,
        });
        revalidatePath("/overview");
        return { success: true, data: board };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to create board" };
    }
}

export async function getCustomBoardsAction() {
    try {
        const session = await requireAuth();
        const boards = await customBoardService.getCustomBoards(session.user.id);
        return { success: true, data: boards };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch boards" };
    }
}

export async function getCustomBoardByIdAction(id: string) {
    try {
        await requireAuth();
        const board = await customBoardService.getCustomBoardById(id);
        return { success: true, data: board };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch board" };
    }
}

export async function updateCustomBoardAction(id: string, data: any) {
    try {
        await requireAuth();
        const board = await customBoardService.updateCustomBoard(id, data);
        revalidatePath("/overview");
        return { success: true, data: board };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to update board" };
    }
}

export async function deleteCustomBoardAction(id: string) {
    try {
        await requireAuth();
        await customBoardService.deleteCustomBoard(id);
        revalidatePath("/overview");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to delete board" };
    }
}

export async function addTaskToCustomBoardAction(boardId: string, taskId: string) {
    try {
        await requireAuth();
        const board = await customBoardService.addTaskToCustomBoard(boardId, taskId);
        return { success: true, data: board };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to add task" };
    }
}

export async function removeTaskFromCustomBoardAction(boardId: string, taskId: string) {
    try {
        await requireAuth();
        const board = await customBoardService.removeTaskFromCustomBoard(boardId, taskId);
        return { success: true, data: board };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to remove task" };
    }
}
