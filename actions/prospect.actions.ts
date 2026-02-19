"use server";

import { requireAdmin } from "./auth.actions";
import * as ProspectService from "@/services/prospect.service";
import type { IProspect } from "@/models/prospect.model";
import type { ProspectFilters, ProspectSort } from "@/types/crm.types";

/**
 * Create a new prospect
 */
export async function createProspect(data: Partial<IProspect>) {
    const session = await requireAdmin();

    try {
        const prospect = await ProspectService.createProspect(data, session.user.id);
        return { success: true, data: JSON.parse(JSON.stringify(prospect)) };
    } catch (error) {
        console.error("Failed to create prospect:", error);
        return { error: "Failed to create prospect" };
    }
}

/**
 * Update a prospect
 */
export async function updateProspect(id: string, data: Partial<IProspect>) {
    await requireAdmin();

    try {
        const prospect = await ProspectService.updateProspect(id, data);
        if (!prospect) return { error: "Prospect not found" };
        return { success: true, data: JSON.parse(JSON.stringify(prospect)) };
    } catch (error) {
        console.error("Failed to update prospect:", error);
        return { error: "Failed to update prospect" };
    }
}

/**
 * Delete a prospect
 */
export async function deleteProspect(id: string) {
    await requireAdmin();

    try {
        const deleted = await ProspectService.deleteProspect(id);
        if (!deleted) return { error: "Prospect not found" };
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete prospect" };
    }
}

/**
 * Get a single prospect by ID
 */
export async function getProspect(id: string) {
    await requireAdmin();

    try {
        const prospect = await ProspectService.getProspectById(id);
        if (!prospect) return { error: "Prospect not found" };
        return { success: true, data: JSON.parse(JSON.stringify(prospect)) };
    } catch (error) {
        return { error: "Failed to fetch prospect" };
    }
}

/**
 * Get prospects with filters, search, sort, pagination
 */
export async function getProspects(options: {
    filters?: Partial<ProspectFilters>;
    sort?: ProspectSort;
    page?: number;
    limit?: number;
}) {
    await requireAdmin();

    try {
        const result = await ProspectService.getProspects(options);
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (error) {
        console.error("Failed to fetch prospects:", error);
        return { error: "Failed to fetch prospects" };
    }
}

/**
 * Get prospect stats for dashboard
 */
export async function getProspectStats() {
    await requireAdmin();

    try {
        const stats = await ProspectService.getProspectStats();
        return { success: true, data: stats };
    } catch (error) {
        return { error: "Failed to fetch stats" };
    }
}

/**
 * Bulk update prospects
 */
export async function bulkUpdateProspects(
    ids: string[],
    updates: {
        pipeline_stage?: string;
        assigned_to?: string;
        addTags?: string[];
        contacted?: boolean;
    }
) {
    await requireAdmin();

    try {
        const result = await ProspectService.bulkUpdateProspects(ids, updates);
        return { success: true, data: result };
    } catch (error) {
        return { error: "Failed to bulk update" };
    }
}

/**
 * Import prospects from CSV data
 */
export async function importProspects(rows: Partial<IProspect>[]) {
    const session = await requireAdmin();

    try {
        const result = await ProspectService.importProspects(rows, session.user.id);
        return { success: true, data: result };
    } catch (error) {
        return { error: "Failed to import prospects" };
    }
}
