import { create } from "zustand";
import { ICustomBoard } from "@/models/custom-board.model";
import {
    createCustomBoardAction,
    getCustomBoardsAction,
    updateCustomBoardAction,
    deleteCustomBoardAction,
    addTaskToCustomBoardAction,
    removeTaskFromCustomBoardAction,
} from "@/actions/custom-board.actions";

interface CustomBoardState {
    boards: ICustomBoard[];
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchBoards: () => Promise<void>;
    createBoard: (data: any) => Promise<{ success: boolean; error?: string }>;
    updateBoard: (id: string, data: any) => Promise<void>;
    deleteBoard: (id: string) => Promise<void>;
    addTask: (boardId: string, taskId: string) => Promise<void>;
    removeTask: (boardId: string, taskId: string) => Promise<void>;
}

export const useCustomBoardStore = create<CustomBoardState>((set, get) => ({
    boards: [],
    isLoading: false,
    error: null,

    fetchBoards: async () => {
        set({ isLoading: true, error: null });
        try {
            const result = await getCustomBoardsAction();
            if (result.success && result.data) {
                set({ boards: result.data as ICustomBoard[] });
            } else {
                set({ error: result.error || "Failed to fetch boards" });
            }
        } catch {
            set({ error: "An unexpected error occurred" });
        } finally {
            set({ isLoading: false });
        }
    },

    createBoard: async (data) => {
        try {
            const result = await createCustomBoardAction(data);
            if (result.success && result.data) {
                set((state) => ({
                    boards: [...state.boards, result.data as ICustomBoard].sort((a, b) => {
                        if (a.isPinned === b.isPinned) return a.name.localeCompare(b.name);
                        return a.isPinned ? -1 : 1;
                    }),
                }));
                return { success: true };
            }
            return { success: false, error: result.error };
        } catch {
            return { success: false, error: "An unexpected error occurred" };
        }
    },

    updateBoard: async (id, data) => {
        try {
            const result = await updateCustomBoardAction(id, data);
            if (result.success && result.data) {
                set((state) => ({
                    boards: state.boards
                        .map((b) => ((b._id as any).toString() === id ? (result.data as ICustomBoard) : b))
                        .sort((a, b) => {
                            if (a.isPinned === b.isPinned) return a.name.localeCompare(b.name);
                            return a.isPinned ? -1 : 1;
                        }),
                }));
            }
        } catch {
            set({ error: "Failed to update board" });
        }
    },

    deleteBoard: async (id) => {
        try {
            const result = await deleteCustomBoardAction(id);
            if (result.success) {
                set((state) => ({
                    boards: state.boards.filter((b) => (b._id as any).toString() !== id),
                }));
            }
        } catch {
            set({ error: "Failed to delete board" });
        }
    },

    addTask: async (boardId, taskId) => {
        try {
            const result = await addTaskToCustomBoardAction(boardId, taskId);
            if (result.success && result.data) {
                set((state) => ({
                    boards: state.boards.map((b) =>
                        (b._id as any).toString() === boardId ? (result.data as ICustomBoard) : b
                    ),
                }));
            }
        } catch {
            set({ error: "Failed to add task to board" });
        }
    },

    removeTask: async (boardId, taskId) => {
        try {
            const result = await removeTaskFromCustomBoardAction(boardId, taskId);
            if (result.success && result.data) {
                set((state) => ({
                    boards: state.boards.map((b) =>
                        (b._id as any).toString() === boardId ? (result.data as ICustomBoard) : b
                    ),
                }));
            }
        } catch {
            set({ error: "Failed to remove task from board" });
        }
    },
}));
