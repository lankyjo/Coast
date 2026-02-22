import { create } from "zustand";
import { ITask } from "@/models/task.model";
import { DailyBoard, Comment } from "@/types/board.types";
import {
    getOrCreateTodayBoard,
    getRecentBoards,
    getBoardTasks,
    addTaskToBoard,
    toggleBoardTaskDone,
    addCommentAction,
    getCommentsForTask,
    deleteBoardTask,
} from "@/actions/board.actions";

interface BoardState {
    boards: DailyBoard[];
    boardTasks: Record<string, ITask[]>; // boardId -> tasks
    comments: Comment[];
    isLoading: boolean;
    isLoadingComments: boolean;
    error: string | null;
    visibilityFilter: "all" | "general" | "private";

    // Actions
    fetchRecentBoards: () => Promise<DailyBoard[]>;
    ensureTodayBoard: () => Promise<DailyBoard | null>;
    fetchBoardTasks: (boardId: string, boardDate?: string) => Promise<void>;
    fetchAllBoardTasks: (boards: { id: string; date: string }[]) => Promise<void>;
    addTaskToBoard: (
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
    ) => Promise<{ success: boolean; error?: string }>;
    toggleTaskDone: (taskId: string, boardId: string) => Promise<void>;
    fetchComments: (taskId: string) => Promise<void>;
    addComment: (
        taskId: string,
        text: string,
        taggedUserIds?: string[]
    ) => Promise<void>;
    deleteBoardTask: (taskId: string, boardId: string) => Promise<void>;
    setVisibilityFilter: (filter: "all" | "general" | "private") => void;
}

export const useBoardStore = create<BoardState>((set, get) => ({
    boards: [],
    boardTasks: {},
    comments: [],
    isLoading: false,
    isLoadingComments: false,
    error: null,
    visibilityFilter: "all",

    fetchRecentBoards: async () => {
        set({ isLoading: true, error: null });
        try {
            const result = await getRecentBoards();
            if (result.success && result.data) {
                set({ boards: result.data as any });
                return result.data as unknown as DailyBoard[];
            } else {
                set({ error: result.error || "Failed to fetch boards" });
                return [];
            }
        } catch {
            set({ error: "An unexpected error occurred" });
            return [];
        } finally {
            set({ isLoading: false });
        }
    },

    ensureTodayBoard: async () => {
        try {
            const result = await getOrCreateTodayBoard();
            if (result.success && result.data) {
                const board = result.data as any as DailyBoard;
                set((state) => {
                    const exists = state.boards.some(
                        (b) => b._id === board._id
                    );
                    if (!exists) {
                        return { boards: [board, ...state.boards] };
                    }
                    return {};
                });
                return board;
            }
            return null;
        } catch {
            return null;
        }
    },

    fetchBoardTasks: async (boardId: string, boardDate?: string) => {
        try {
            const result = await getBoardTasks(boardId, boardDate);
            if (result.success && result.data) {
                set((state) => ({
                    boardTasks: {
                        ...state.boardTasks,
                        [boardId]: result.data as ITask[],
                    },
                }));
            }
        } catch {
            set({ error: "Failed to fetch board tasks" });
        }
    },

    fetchAllBoardTasks: async (boards: { id: string; date: string }[]) => {
        if (boards.length === 0) return;

        try {
            const promises = boards.map(b => getBoardTasks(b.id, b.date));
            const results = await Promise.all(promises);

            const newBoardTasks: Record<string, ITask[]> = {};

            results.forEach((result, index) => {
                if (result.success && result.data) {
                    newBoardTasks[boards[index].id] = result.data as ITask[];
                }
            });

            set((state) => ({
                boardTasks: {
                    ...state.boardTasks,
                    ...newBoardTasks,
                },
            }));
        } catch {
            set({ error: "Failed to fetch all board tasks" });
        }
    },

    addTaskToBoard: async (boardId, taskData) => {
        try {
            const result = await addTaskToBoard(boardId, taskData);
            if (result.success && result.data) {
                set((state) => ({
                    boardTasks: {
                        ...state.boardTasks,
                        [boardId]: [
                            ...(state.boardTasks[boardId] || []),
                            result.data as ITask,
                        ],
                    },
                }));
                return { success: true };
            }
            return {
                success: false,
                error: result.error || "Failed to add task",
            };
        } catch {
            return { success: false, error: "An unexpected error occurred" };
        }
    },

    toggleTaskDone: async (taskId: string, boardId: string) => {
        try {
            const result = await toggleBoardTaskDone(taskId);
            if (result.success && result.data) {
                set((state) => ({
                    boardTasks: {
                        ...state.boardTasks,
                        [boardId]: (state.boardTasks[boardId] || []).map((t) =>
                            t._id.toString() === taskId
                                ? (result.data as ITask)
                                : t
                        ),
                    },
                }));
            }
        } catch {
            set({ error: "Failed to toggle task" });
        }
    },

    fetchComments: async (taskId: string) => {
        set({ isLoadingComments: true });
        try {
            const result = await getCommentsForTask(taskId);
            if (result.success && result.data) {
                set({ comments: result.data });
            }
        } catch {
            console.error("Failed to fetch comments");
        } finally {
            set({ isLoadingComments: false });
        }
    },

    addComment: async (
        taskId: string,
        text: string,
        taggedUserIds: string[] = []
    ) => {
        try {
            const result = await addCommentAction(
                taskId,
                text,
                taggedUserIds
            );
            if (result.success && result.data) {
                // Refetch comments to get populated user data
                await get().fetchComments(taskId);
            }
        } catch {
            console.error("Failed to add comment");
        }
    },

    deleteBoardTask: async (taskId: string, boardId: string) => {
        try {
            const result = await deleteBoardTask(taskId);
            if (result.success) {
                set((state) => ({
                    boardTasks: {
                        ...state.boardTasks,
                        [boardId]: (state.boardTasks[boardId] || []).filter(
                            (t) => t._id.toString() !== taskId
                        ),
                    },
                }));
            }
        } catch {
            set({ error: "Failed to delete task" });
        }
    },

    setVisibilityFilter: (filter) => set({ visibilityFilter: filter }),
}));
