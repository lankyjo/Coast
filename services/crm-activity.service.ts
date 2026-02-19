import { connectDB } from "@/lib/db";
import { CrmActivity } from "@/models/crm-activity.model";
import "@/models/user.model"; // Register User schema for populate
import "@/models/prospect.model"; // Register Prospect schema for populate
import type { CrmActivityType, ActivityOutcome } from "@/types/crm.types";
import mongoose from "mongoose";

/**
 * Log a CRM activity
 */
export async function logActivity(data: {
    prospect_id: string;
    performed_by: string;
    activity_type: CrmActivityType;
    subject: string;
    details?: string;
    template_id?: string;
    outcome?: ActivityOutcome;
    follow_up_date?: Date;
    is_automated?: boolean;
}) {
    await connectDB();

    const activity = await CrmActivity.create({
        prospect_id: new mongoose.Types.ObjectId(data.prospect_id),
        performed_by: new mongoose.Types.ObjectId(data.performed_by),
        activity_type: data.activity_type,
        subject: data.subject,
        details: data.details,
        template_id: data.template_id
            ? new mongoose.Types.ObjectId(data.template_id)
            : undefined,
        outcome: data.outcome,
        follow_up_date: data.follow_up_date,
        is_automated: data.is_automated || false,
    });

    return JSON.parse(JSON.stringify(activity));
}

/**
 * Get activities for a prospect (timeline)
 */
export async function getActivitiesForProspect(
    prospectId: string,
    limit = 50
) {
    await connectDB();

    const activities = await CrmActivity.find({
        prospect_id: prospectId,
    })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("performed_by", "name image")
        .populate("template_id", "name")
        .lean();

    return JSON.parse(JSON.stringify(activities));
}

/**
 * Get recent activities across all prospects (dashboard feed)
 */
export async function getRecentActivities(limit = 20) {
    await connectDB();

    const activities = await CrmActivity.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("performed_by", "name image")
        .populate("prospect_id", "business_name")
        .lean();

    return JSON.parse(JSON.stringify(activities));
}

/**
 * Get activity counts for dashboard stats
 */
export async function getActivityStats() {
    await connectDB();

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [weekCount, monthCount, typeCounts] = await Promise.all([
        CrmActivity.countDocuments({ createdAt: { $gte: weekAgo } }),
        CrmActivity.countDocuments({ createdAt: { $gte: monthAgo } }),
        CrmActivity.aggregate([
            { $match: { createdAt: { $gte: monthAgo } } },
            { $group: { _id: "$activity_type", count: { $sum: 1 } } },
        ]),
    ]);

    const typeMap: Record<string, number> = {};
    for (const t of typeCounts) {
        typeMap[t._id] = t.count;
    }

    return {
        thisWeek: weekCount,
        thisMonth: monthCount,
        byType: typeMap,
    };
}
