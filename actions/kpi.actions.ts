"use server";

import { requireAuth } from "./auth.actions";
import * as kpiService from "@/services/kpi.service";

export async function getUserKPIsAction() {
    try {
        const session = await requireAuth();
        const kpis = await kpiService.getUserKPIs(session.user.id);
        return { success: true, data: kpis };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch KPIs" };
    }
}
