import { create } from "zustand";
import type { Prospect, PipelineStage } from "@/types/crm.types";

interface PipelineColumn {
    stage: PipelineStage;
    label: string;
    prospects: Prospect[];
}

interface PipelineStore {
    columns: PipelineColumn[];
    summary: Record<string, number>;
    isLoading: boolean;
    filterByMember: string | "all";

    setColumns: (data: Record<string, Prospect[]>) => void;
    setSummary: (summary: Record<string, number>) => void;
    moveProspect: (prospectId: string, fromStage: PipelineStage, toStage: PipelineStage) => void;
    setLoading: (loading: boolean) => void;
    setFilterByMember: (memberId: string | "all") => void;
}

const STAGE_LABELS: Record<PipelineStage, string> = {
    new_lead: "New Lead",
    contacted: "Contacted",
    follow_up: "Follow-Up",
    responded: "Responded",
    discovery: "Discovery",
    proposal_sent: "Proposal Sent",
    negotiation: "Negotiation",
    won: "Won",
    project_started: "Project Started",
    lost: "Lost",
    nurture: "Nurture",
};

const ALL_STAGES: PipelineStage[] = [
    "new_lead",
    "contacted",
    "follow_up",
    "responded",
    "discovery",
    "proposal_sent",
    "negotiation",
    "won",
    "project_started",
    "lost",
    "nurture",
];

export const usePipelineStore = create<PipelineStore>((set) => ({
    columns: ALL_STAGES.map((stage) => ({
        stage,
        label: STAGE_LABELS[stage],
        prospects: [],
    })),
    summary: {},
    isLoading: false,
    filterByMember: "all",

    setColumns: (data) =>
        set({
            columns: ALL_STAGES.map((stage) => ({
                stage,
                label: STAGE_LABELS[stage],
                prospects: data[stage] || [],
            })),
        }),
    setSummary: (summary) => set({ summary }),
    moveProspect: (prospectId, fromStage, toStage) =>
        set((s) => {
            const newColumns = s.columns.map((col) => {
                if (col.stage === fromStage) {
                    return {
                        ...col,
                        prospects: col.prospects.filter(
                            (p) => p._id !== prospectId
                        ),
                    };
                }
                if (col.stage === toStage) {
                    const movedProspect = s.columns
                        .find((c) => c.stage === fromStage)
                        ?.prospects.find((p) => p._id === prospectId);
                    if (movedProspect) {
                        return {
                            ...col,
                            prospects: [
                                { ...movedProspect, pipeline_stage: toStage },
                                ...col.prospects,
                            ],
                        };
                    }
                }
                return col;
            });
            return { columns: newColumns };
        }),
    setLoading: (isLoading) => set({ isLoading }),
    setFilterByMember: (filterByMember) => set({ filterByMember }),
}));

export { STAGE_LABELS, ALL_STAGES };
