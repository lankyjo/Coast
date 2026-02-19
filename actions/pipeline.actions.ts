"use server";

import { requireAdmin } from "./auth.actions";
import * as PipelineService from "@/services/pipeline.service";
import * as AutomationService from "@/services/automation.service";
import type { PipelineStage } from "@/types/crm.types";

/**
 * Change a prospect's pipeline stage
 * Handles auto-sync, history logging, and auto thank-you triggers
 */
export async function changeStage(
    prospectId: string,
    toStage: PipelineStage,
    notes?: string
) {
    const session = await requireAdmin();

    try {
        const result = await PipelineService.changeStage(
            prospectId,
            toStage,
            session.user.id,
            notes
        );

        if (!result.success) return { error: result.error };

        // Trigger auto thank-you if applicable
        const thankYouTriggers: Record<string, string> = {
            responded: "thank_you_responded",
            won: "thank_you_won",
            project_started: "thank_you_project_started",
        };

        if (thankYouTriggers[toStage]) {
            // Fire and forget — don't block the stage change on email
            AutomationService.processThankYou(
                prospectId,
                thankYouTriggers[toStage],
                session.user.id
            ).catch((err) => console.error("Auto thank-you error:", err));
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to change stage:", error);
        return { error: "Failed to change stage" };
    }
}

/**
 * Get pipeline history for a prospect
 */
export async function getHistory(prospectId: string) {
    await requireAdmin();

    try {
        const history = await PipelineService.getHistory(prospectId);
        return { success: true, data: history };
    } catch (error) {
        return { error: "Failed to fetch history" };
    }
}

/**
 * Get pipeline summary (counts per stage)
 */
export async function getPipelineSummary() {
    await requireAdmin();

    try {
        const summary = await PipelineService.getPipelineSummary();
        return { success: true, data: summary };
    } catch (error) {
        return { error: "Failed to fetch pipeline summary" };
    }
}

/**
 * Get all prospects grouped by stage for Kanban
 */
export async function getProspectsByStage() {
    await requireAdmin();

    try {
        const columns = await PipelineService.getProspectsByStage();
        return { success: true, data: columns };
    } catch (error) {
        return { error: "Failed to fetch pipeline data" };
    }
}

/**
 * Get stale deal alerts
 */
export async function getStaleDealAlerts() {
    await requireAdmin();

    try {
        const alerts = await PipelineService.getStaleDealAlerts();
        return { success: true, data: alerts };
    } catch (error) {
        return { error: "Failed to fetch stale deals" };
    }
}
