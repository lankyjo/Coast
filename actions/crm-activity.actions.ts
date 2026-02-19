"use server";

import { requireAdmin } from "./auth.actions";
import * as CrmActivityService from "@/services/crm-activity.service";
import type { CrmActivityType, ActivityOutcome } from "@/types/crm.types";

/**
 * Log a CRM activity (call, email, note, meeting)
 */
export async function logActivity(data: {
    prospect_id: string;
    activity_type: CrmActivityType;
    subject: string;
    details?: string;
    template_id?: string;
    outcome?: ActivityOutcome;
    follow_up_date?: string;
}) {
    const session = await requireAdmin();

    try {
        const activity = await CrmActivityService.logActivity({
            ...data,
            performed_by: session.user.id,
            follow_up_date: data.follow_up_date
                ? new Date(data.follow_up_date)
                : undefined,
        });

        return { success: true, data: activity };
    } catch (error) {
        console.error("Failed to log activity:", error);
        return { error: "Failed to log activity" };
    }
}

/**
 * Get activities for a prospect (timeline)
 */
export async function getActivitiesForProspect(prospectId: string) {
    await requireAdmin();

    try {
        const activities =
            await CrmActivityService.getActivitiesForProspect(prospectId);
        return { success: true, data: activities };
    } catch (error) {
        return { error: "Failed to fetch activities" };
    }
}

/**
 * Get recent activities across all prospects
 */
export async function getRecentActivities() {
    await requireAdmin();

    try {
        const activities = await CrmActivityService.getRecentActivities();
        return { success: true, data: activities };
    } catch (error) {
        return { error: "Failed to fetch recent activities" };
    }
}

/**
 * Get activity stats for dashboard
 */
export async function getActivityStats() {
    await requireAdmin();

    try {
        const stats = await CrmActivityService.getActivityStats();
        return { success: true, data: stats };
    } catch (error) {
        return { error: "Failed to fetch activity stats" };
    }
}
