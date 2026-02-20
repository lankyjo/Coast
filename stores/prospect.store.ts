import { create } from "zustand";
import type {
    Prospect,
    ProspectFilters,
    ProspectSort,
    ProspectViewMode,
} from "@/types/crm.types";

interface ProspectStore {
    prospects: Prospect[];
    activeProspect: Prospect | null;
    total: number;
    page: number;
    totalPages: number;
    isLoading: boolean;
    viewMode: ProspectViewMode;
    filters: ProspectFilters;
    sort: ProspectSort;
    selectedIds: string[];

    setProspects: (prospects: Prospect[], total: number, page: number, totalPages: number) => void;
    setActiveProspect: (prospect: Prospect | null) => void;
    addProspect: (prospect: Prospect) => void;
    updateProspect: (id: string, updates: Partial<Prospect>) => void;
    removeProspect: (id: string) => void;
    setLoading: (loading: boolean) => void;
    setViewMode: (mode: ProspectViewMode) => void;
    setFilters: (filters: Partial<ProspectFilters>) => void;
    resetFilters: () => void;
    setSort: (sort: ProspectSort) => void;
    setPage: (page: number) => void;
    toggleSelected: (id: string) => void;
    selectAll: () => void;
    clearSelection: () => void;
}

const defaultFilters: ProspectFilters = {
    market: "all",
    category: "all",
    pipeline_stage: "all",
    rating_score_min: 1,
    rating_score_max: 5,
    contacted: "all",
    responded: "all",
    deal_closed: "all",
    assigned_to: "all",
    lead_source: "all",
    search: "",
};

export const useProspectStore = create<ProspectStore>((set) => ({
    prospects: [],
    activeProspect: null,
    total: 0,
    page: 1,
    totalPages: 1,
    isLoading: false,
    viewMode: "list",
    filters: defaultFilters,
    sort: { field: "rating_score", direction: "desc" },
    selectedIds: [],

    setProspects: (prospects, total, page, totalPages) =>
        set({ prospects, total, page, totalPages }),
    setActiveProspect: (prospect) => set({ activeProspect: prospect }),
    addProspect: (prospect) =>
        set((s) => ({ prospects: [prospect, ...s.prospects] })),
    updateProspect: (id, updates) =>
        set((s) => ({
            prospects: s.prospects.map((p) =>
                p._id === id ? { ...p, ...updates } : p
            ),
            activeProspect:
                s.activeProspect?._id === id
                    ? { ...s.activeProspect, ...updates }
                    : s.activeProspect,
        })),
    removeProspect: (id) =>
        set((s) => ({
            prospects: s.prospects.filter((p) => p._id !== id),
            activeProspect:
                s.activeProspect?._id === id ? null : s.activeProspect,
        })),
    setLoading: (isLoading) => set({ isLoading }),
    setViewMode: (viewMode) => set({ viewMode }),
    setFilters: (filters) =>
        set((s) => ({ filters: { ...s.filters, ...filters }, page: 1 })),
    resetFilters: () => set({ filters: defaultFilters, page: 1 }),
    setSort: (sort) => set({ sort }),
    setPage: (page) => set({ page }),
    toggleSelected: (id) =>
        set((s) => ({
            selectedIds: s.selectedIds.includes(id)
                ? s.selectedIds.filter((i) => i !== id)
                : [...s.selectedIds, id],
        })),
    selectAll: () =>
        set((s) => ({ selectedIds: s.prospects.map((p) => p._id) })),
    clearSelection: () => set({ selectedIds: [] }),
}));
