import { create } from "zustand";
import { getUserKPIsAction } from "@/actions/kpi.actions";
import { UserKPIs } from "@/services/kpi.service";

interface KPIState {
    kpis: UserKPIs | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchKPIs: () => Promise<void>;
}

export const useKPIStore = create<KPIState>((set) => ({
    kpis: null,
    isLoading: false,
    error: null,

    fetchKPIs: async () => {
        set({ isLoading: true, error: null });
        try {
            const result = await getUserKPIsAction();
            if (result.success && result.data) {
                set({ kpis: result.data });
            } else {
                set({ error: result.error || "Failed to fetch KPIs" });
            }
        } catch {
            set({ error: "An unexpected error occurred" });
        } finally {
            set({ isLoading: false });
        }
    },
}));
