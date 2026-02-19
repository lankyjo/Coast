"use server";

import { requireAdmin } from "./auth.actions";
import * as AutomationService from "@/services/automation.service";

/**
 * Get all automation configs
 */
export async function getAutomationConfigs() {
    await requireAdmin();

    try {
        const configs = await AutomationService.getConfigs();
        return { success: true, data: configs };
    } catch (error) {
        return { error: "Failed to fetch automation configs" };
    }
}

/**
 * Update an automation config
 */
export async function updateAutomationConfig(
    id: string,
    data: { enabled?: boolean; template_id?: string; delay_days?: number }
) {
    await requireAdmin();

    try {
        const config = await AutomationService.updateConfig(id, data);
        if (!config) return { error: "Config not found" };
        return { success: true, data: config };
    } catch (error) {
        return { error: "Failed to update automation config" };
    }
}

/**
 * Seed default automation configs
 */
export async function seedAutomationConfigs() {
    await requireAdmin();

    try {
        await AutomationService.seedDefaultConfigs();
        return { success: true };
    } catch (error) {
        return { error: "Failed to seed configs" };
    }
}

/**
 * Manually trigger follow-up processing
 */
export async function processFollowUpsNow() {
    const session = await requireAdmin();

    try {
        const result = await AutomationService.processFollowUps(session.user.id);
        return { success: true, data: result };
    } catch (error) {
        console.error("Failed to process follow-ups:", error);
        return { error: "Failed to process follow-ups" };
    }
}
