import { connectDB } from "@/lib/db";
import { Prospect } from "@/models/prospect.model";
import { PipelineHistory } from "@/models/pipeline-history.model";
import { CrmActivity } from "@/models/crm-activity.model";
import type { PipelineStage } from "@/types/crm.types";
import mongoose from "mongoose";

/**
 * Stage-to-status field auto-sync mapping
 */
const STAGE_SYNCS: Record<string, Record<string, unknown>> = {
    contacted: { contacted: true, contacted_at: new Date() },
    responded: { responded: true, responded_at: new Date() },
    won: { deal_closed: true, deal_closed_at: new Date() },
    project_started: { project_started: true, project_started_at: new Date() },
};

/**
 * Change a prospect's pipeline stage with auto-sync and history logging
 */
export async function changeStage(
    prospectId: string,
    toStage: PipelineStage,
    userId: string,
    notes?: string
): Promise<{ success: boolean; error?: string }> {
    await connectDB();

    const prospect = await Prospect.findById(prospectId);
    if (!prospect) return { success: false, error: "Prospect not found" };

    const fromStage = prospect.pipeline_stage;
    if (fromStage === toStage) return { success: true };

    // Auto-sync status fields
    const syncUpdates = STAGE_SYNCS[toStage] || {};
    prospect.pipeline_stage = toStage;
    Object.assign(prospect, syncUpdates);
    await prospect.save();

    // Log pipeline history
    await PipelineHistory.create({
        prospect_id: new mongoose.Types.ObjectId(prospectId),
        from_stage: fromStage,
        to_stage: toStage,
        changed_by: new mongoose.Types.ObjectId(userId),
        notes,
    });

    // Log as CRM activity
    await CrmActivity.create({
        prospect_id: new mongoose.Types.ObjectId(prospectId),
        performed_by: new mongoose.Types.ObjectId(userId),
        activity_type: "stage_changed",
        subject: `Stage changed from ${formatStage(fromStage)} to ${formatStage(toStage)}`,
        details: notes,
        is_automated: false,
    });

    return { success: true };
}

/**
 * Get pipeline history for a prospect
 */
export async function getHistory(prospectId: string) {
    await connectDB();

    const history = await PipelineHistory.find({ prospect_id: prospectId })
        .sort({ createdAt: -1 })
        .populate("changed_by", "name image")
        .lean();

    return JSON.parse(JSON.stringify(history));
}

/**
 * Get pipeline summary — counts per stage
 */
export async function getPipelineSummary() {
    await connectDB();

    const stages = await Prospect.aggregate([
        { $group: { _id: "$pipeline_stage", count: { $sum: 1 } } },
    ]);

    const stageMap: Record<string, number> = {};
    for (const s of stages) {
        stageMap[s._id] = s.count;
    }

    return stageMap;
}

/**
 * Get all prospects grouped by pipeline stage for Kanban view
 */
export async function getProspectsByStage() {
    await connectDB();

    const prospects = await Prospect.find()
        .sort({ weakness_score: -1, updatedAt: -1 })
        .populate("assigned_to", "name image")
        .lean();

    const columns: Record<string, typeof prospects> = {};
    const allStages: PipelineStage[] = [
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

    for (const stage of allStages) {
        columns[stage] = [];
    }

    for (const p of prospects) {
        const stage = p.pipeline_stage as PipelineStage;
        if (columns[stage]) {
            columns[stage].push(p);
        }
    }

    return JSON.parse(JSON.stringify(columns));
}

/**
 * Get stale deals — prospects that haven't moved stages
 */
export async function getStaleDealAlerts() {
    await connectDB();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const staleProspects = await Prospect.find({
        pipeline_stage: {
            $nin: ["won", "lost", "project_started", "nurture", "new_lead"],
        },
        updatedAt: { $lt: sevenDaysAgo },
    })
        .sort({ updatedAt: 1 })
        .populate("assigned_to", "name image")
        .lean();

    return JSON.parse(JSON.stringify(
        staleProspects.map((p) => ({
            ...p,
            severity: p.updatedAt < fourteenDaysAgo ? "red" : "orange",
            daysStale: Math.floor(
                (Date.now() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
            ),
        }))
    ));
}

/**
 * Format stage name for display
 */
function formatStage(stage: string): string {
    return stage
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
}
