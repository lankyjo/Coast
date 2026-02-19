import { create } from "zustand";
import type { Template, TemplateCategory } from "@/types/crm.types";

interface TemplateStore {
    templates: Template[];
    activeTemplate: Template | null;
    isLoading: boolean;
    filterCategory: TemplateCategory | "all";
    filterAutoOnly: boolean;

    setTemplates: (templates: Template[]) => void;
    setActiveTemplate: (template: Template | null) => void;
    addTemplate: (template: Template) => void;
    updateTemplate: (id: string, updates: Partial<Template>) => void;
    removeTemplate: (id: string) => void;
    setLoading: (loading: boolean) => void;
    setFilterCategory: (category: TemplateCategory | "all") => void;
    setFilterAutoOnly: (autoOnly: boolean) => void;
}

export const useTemplateStore = create<TemplateStore>((set) => ({
    templates: [],
    activeTemplate: null,
    isLoading: false,
    filterCategory: "all",
    filterAutoOnly: false,

    setTemplates: (templates) => set({ templates }),
    setActiveTemplate: (template) => set({ activeTemplate: template }),
    addTemplate: (template) =>
        set((s) => ({ templates: [template, ...s.templates] })),
    updateTemplate: (id, updates) =>
        set((s) => ({
            templates: s.templates.map((t) =>
                t._id === id ? { ...t, ...updates } : t
            ),
            activeTemplate:
                s.activeTemplate?._id === id
                    ? { ...s.activeTemplate, ...updates }
                    : s.activeTemplate,
        })),
    removeTemplate: (id) =>
        set((s) => ({
            templates: s.templates.filter((t) => t._id !== id),
            activeTemplate:
                s.activeTemplate?._id === id ? null : s.activeTemplate,
        })),
    setLoading: (isLoading) => set({ isLoading }),
    setFilterCategory: (filterCategory) => set({ filterCategory }),
    setFilterAutoOnly: (filterAutoOnly) => set({ filterAutoOnly }),
}));
