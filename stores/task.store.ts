import { create } from "zustand";
import { ITask } from "@/models/task.model";
import {
    createTask,
    getTasks,
    updateTask,
    deleteTask,
    addSubtask,
    toggleSubtask,
} from "@/actions/task.actions";
import { CreateTaskInput, UpdateTaskInput, TaskFilters } from "@/types/task.types";

interface TaskState {
    tasks: ITask[];
    isLoading: boolean;
    error: string | null;
    viewMode: "list" | "kanban";
    filters: TaskFilters;

    // Actions
    fetchTasks: (filters?: Partial<TaskFilters>) => Promise<void>;
    createTask: (data: CreateTaskInput) => Promise<ITask | null>;
    updateTask: (id: string, data: UpdateTaskInput) => Promise<void>;
    deleteTask: (id: string) => Promise<boolean>;
    addSubtask: (taskId: string, title: string) => Promise<void>;
    toggleSubtask: (taskId: string, subtaskId: string, done: boolean) => Promise<void>;
    setViewMode: (mode: "list" | "kanban") => void;
    setFilters: (filters: Partial<TaskFilters>) => void;
}

const DEFAULT_FILTERS: TaskFilters = {
    status: "all",
    priority: "all",
    assignee: "all",
    project: "all",
    search: "",
};

export const useTaskStore = create<TaskState>((set, get) => ({
    tasks: [],
    isLoading: false,
    error: null,
    viewMode: "list",
    filters: DEFAULT_FILTERS,

    fetchTasks: async (filters = {}) => {
        set({ isLoading: true, error: null });
        const currentFilters = { ...get().filters, ...filters };

        // Update filters state if passed
        if (Object.keys(filters).length > 0) {
            set({ filters: currentFilters });
        }

        try {
            const result = await getTasks(currentFilters);
            if (result.success && result.data) {
                set({ tasks: result.data });
            } else {
                set({ error: result.error || "Failed to fetch tasks" });
            }
        } catch (error) {
            set({ error: "An unexpected error occurred" });
        } finally {
            set({ isLoading: false });
        }
    },

    createTask: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const result = await createTask(data);
            if (result.success && result.data) {
                set((state) => ({
                    tasks: [result.data as ITask, ...state.tasks],
                }));
                return result.data as ITask;
            } else {
                set({ error: result.error || "Failed to create task" });
                return null;
            }
        } catch (error) {
            set({ error: "An unexpected error occurred" });
            return null;
        } finally {
            set({ isLoading: false });
        }
    },

    updateTask: async (id, data) => {
        // Optimistic update for simple status changes could go here
        // For now, we'll wait for server response to be safe
        try {
            const result = await updateTask(id, data);
            if (result.success && result.data) {
                set((state) => ({
                    tasks: state.tasks.map((t) =>
                        t._id.toString() === id ? (result.data as ITask) : t
                    ),
                }));
            } else {
                set({ error: result.error || "Failed to update task" });
            }
        } catch (error) {
            set({ error: "An unexpected error occurred" });
        }
    },

    deleteTask: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const result = await deleteTask(id);
            if (result.success) {
                set((state) => ({
                    tasks: state.tasks.filter((t) => t._id.toString() !== id),
                }));
                return true;
            } else {
                set({ error: result.error || "Failed to delete task" });
                return false;
            }
        } catch (error) {
            set({ error: "An unexpected error occurred" });
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    addSubtask: async (taskId, title) => {
        try {
            const result = await addSubtask(taskId, title);
            if (result.success && result.data) {
                set((state) => ({
                    tasks: state.tasks.map((t) =>
                        t._id.toString() === taskId ? (result.data as ITask) : t
                    ),
                }));
            }
        } catch (error) {
            set({ error: "Failed to add subtask" });
        }
    },

    toggleSubtask: async (taskId, subtaskId, done) => {
        try {
            const result = await toggleSubtask(taskId, subtaskId, done);
            if (result.success && result.data) {
                set((state) => ({
                    tasks: state.tasks.map((t) =>
                        t._id.toString() === taskId ? (result.data as ITask) : t
                    ),
                }));
            }
        } catch (error) {
            set({ error: "Failed to toggle subtask" });
        }
    },

    setViewMode: (mode) => set({ viewMode: mode }),

    setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
    })),
}));
