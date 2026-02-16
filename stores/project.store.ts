import { create } from "zustand";
import { IProject } from "@/models/project.model";
import {
    createProject,
    getProjects,
    updateProject,
    deleteProject,
    getProjectById,
} from "@/actions/project.actions";
import { CreateProjectInput, UpdateProjectInput, ProjectStatus } from "@/types/project.types";

interface ProjectState {
    projects: IProject[];
    currentProject: IProject | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchProjects: (filters?: { status?: ProjectStatus; search?: string }) => Promise<void>;
    fetchProjectById: (id: string) => Promise<void>;
    createProject: (data: CreateProjectInput) => Promise<IProject | null>;
    updateProject: (id: string, data: UpdateProjectInput) => Promise<void>;
    deleteProject: (id: string) => Promise<boolean>;
    setCurrentProject: (project: IProject | null) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
    projects: [],
    currentProject: null,
    isLoading: false,
    error: null,

    fetchProjects: async (filters) => {
        set({ isLoading: true, error: null });
        try {
            const result = await getProjects(filters);
            if (result.success && result.data) {
                set({ projects: result.data });
            } else {
                set({ error: result.error || "Failed to fetch projects" });
            }
        } catch (error) {
            set({ error: "An unexpected error occurred" });
        } finally {
            set({ isLoading: false });
        }
    },

    fetchProjectById: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const result = await getProjectById(id);
            if (result.success && result.data) {
                set({ currentProject: result.data });
            } else {
                set({ error: result.error || "Failed to fetch project" });
            }
        } catch (error) {
            set({ error: "An unexpected error occurred" });
        } finally {
            set({ isLoading: false });
        }
    },

    createProject: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const result = await createProject(data);
            if (result.success && result.data) {
                set((state) => ({
                    projects: [result.data as IProject, ...state.projects],
                }));
                return result.data as IProject;
            } else {
                set({ error: result.error || "Failed to create project" });
                return null;
            }
        } catch (error) {
            set({ error: "An unexpected error occurred" });
            return null;
        } finally {
            set({ isLoading: false });
        }
    },

    updateProject: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
            const result = await updateProject(id, data);
            if (result.success && result.data) {
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p._id.toString() === id ? (result.data as IProject) : p
                    ),
                    currentProject:
                        state.currentProject?._id.toString() === id
                            ? (result.data as IProject)
                            : state.currentProject,
                }));
            } else {
                set({ error: result.error || "Failed to update project" });
            }
        } catch (error) {
            set({ error: "An unexpected error occurred" });
        } finally {
            set({ isLoading: false });
        }
    },

    deleteProject: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const result = await deleteProject(id);
            if (result.success) {
                set((state) => ({
                    projects: state.projects.filter((p) => p._id.toString() !== id),
                    currentProject:
                        state.currentProject?._id.toString() === id ? null : state.currentProject,
                }));
                return true;
            } else {
                set({ error: result.error || "Failed to delete project" });
                return false;
            }
        } catch (error) {
            set({ error: "An unexpected error occurred" });
            return false;
        } finally {
            set({ isLoading: false });
        }
    },

    setCurrentProject: (project) => set({ currentProject: project }),
}));
