import { connectDB } from "@/lib/db";
import { CrmTemplate } from "@/models/template.model";
import { TemplateSend } from "@/models/template-send.model";
import type { ICrmTemplate } from "@/models/template.model";
import mongoose from "mongoose";

/**
 * Create a new email template
 */
export async function createTemplate(
    data: Partial<ICrmTemplate>,
    userId: string
) {
    await connectDB();

    const template = await CrmTemplate.create({
        ...data,
        created_by: new mongoose.Types.ObjectId(userId),
    });

    return JSON.parse(JSON.stringify(template));
}

/**
 * Update a template
 */
export async function updateTemplate(id: string, data: Partial<ICrmTemplate>) {
    await connectDB();

    const template = await CrmTemplate.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true }
    ).lean();

    return JSON.parse(JSON.stringify(template));
}

/**
 * Delete a template
 */
export async function deleteTemplate(id: string) {
    await connectDB();
    const result = await CrmTemplate.findByIdAndDelete(id);
    return !!result;
}

/**
 * Get all templates with optional filters
 */
export async function getTemplates(filters?: {
    category?: string;
    is_auto_template?: boolean;
    target_industry?: string;
}) {
    await connectDB();

    const query: Record<string, unknown> = {};
    if (filters?.category) query.category = filters.category;
    if (filters?.is_auto_template !== undefined) {
        query.is_auto_template = filters.is_auto_template;
    }
    if (filters?.target_industry) query.target_industry = filters.target_industry;

    const templates = await CrmTemplate.find(query)
        .sort({ updatedAt: -1 })
        .populate("created_by", "name")
        .lean();

    return JSON.parse(JSON.stringify(templates));
}

/**
 * Get a single template by ID
 */
export async function getTemplateById(id: string) {
    await connectDB();

    const template = await CrmTemplate.findById(id)
        .populate("created_by", "name")
        .lean();

    return JSON.parse(JSON.stringify(template));
}

/**
 * Log a template send
 */
export async function logTemplateSend(data: {
    template_id: string;
    prospect_id: string;
    sent_by: string;
    is_automated: boolean;
}) {
    await connectDB();

    const send = await TemplateSend.create({
        template_id: new mongoose.Types.ObjectId(data.template_id),
        prospect_id: new mongoose.Types.ObjectId(data.prospect_id),
        sent_by: new mongoose.Types.ObjectId(data.sent_by),
        is_automated: data.is_automated,
        status: "sent",
    });

    return JSON.parse(JSON.stringify(send));
}

/**
 * Update send status (opened, replied, bounced)
 */
export async function updateSendStatus(
    sendId: string,
    status: "opened" | "replied" | "bounced",
    sentiment?: "positive" | "neutral" | "negative"
) {
    await connectDB();

    const updates: Record<string, unknown> = { status };
    if (status === "replied") {
        updates.replied_at = new Date();
        if (sentiment) updates.reply_sentiment = sentiment;
    }

    const send = await TemplateSend.findByIdAndUpdate(
        sendId,
        { $set: updates },
        { new: true }
    ).lean();

    return JSON.parse(JSON.stringify(send));
}

/**
 * Get performance stats for templates
 */
export async function getTemplatePerformanceStats() {
    await connectDB();

    const stats = await TemplateSend.aggregate([
        {
            $group: {
                _id: "$template_id",
                totalSends: { $sum: 1 },
                manualSends: {
                    $sum: { $cond: ["$is_automated", 0, 1] },
                },
                autoSends: {
                    $sum: { $cond: ["$is_automated", 1, 0] },
                },
                replyCount: {
                    $sum: {
                        $cond: [{ $eq: ["$status", "replied"] }, 1, 0],
                    },
                },
                positiveReplies: {
                    $sum: {
                        $cond: [
                            { $eq: ["$reply_sentiment", "positive"] },
                            1,
                            0,
                        ],
                    },
                },
                lastSent: { $max: "$sent_at" },
            },
        },
        {
            $lookup: {
                from: "crmtemplates",
                localField: "_id",
                foreignField: "_id",
                as: "template",
            },
        },
        { $unwind: "$template" },
        {
            $project: {
                templateId: "$_id",
                name: "$template.name",
                totalSends: 1,
                manualSends: 1,
                autoSends: 1,
                replyCount: 1,
                replyRate: {
                    $cond: [
                        { $gt: ["$totalSends", 0] },
                        {
                            $multiply: [
                                { $divide: ["$replyCount", "$totalSends"] },
                                100,
                            ],
                        },
                        0,
                    ],
                },
                positiveReplyRate: {
                    $cond: [
                        { $gt: ["$replyCount", 0] },
                        {
                            $multiply: [
                                {
                                    $divide: [
                                        "$positiveReplies",
                                        "$replyCount",
                                    ],
                                },
                                100,
                            ],
                        },
                        0,
                    ],
                },
                lastUsed: "$lastSent",
            },
        },
        { $sort: { replyRate: -1 } },
    ]);

    return JSON.parse(JSON.stringify(stats));
}

/**
 * Get overall outreach stats
 */
export async function getOverallOutreachStats() {
    await connectDB();

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [weekStats, monthStats] = await Promise.all([
        TemplateSend.aggregate([
            { $match: { sent_at: { $gte: weekAgo } } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    manual: { $sum: { $cond: ["$is_automated", 0, 1] } },
                    auto: { $sum: { $cond: ["$is_automated", 1, 0] } },
                    replies: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "replied"] }, 1, 0],
                        },
                    },
                },
            },
        ]),
        TemplateSend.aggregate([
            { $match: { sent_at: { $gte: monthAgo } } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    manual: { $sum: { $cond: ["$is_automated", 0, 1] } },
                    auto: { $sum: { $cond: ["$is_automated", 1, 0] } },
                    replies: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "replied"] }, 1, 0],
                        },
                    },
                },
            },
        ]),
    ]);

    const week = weekStats[0] || { total: 0, manual: 0, auto: 0, replies: 0 };
    const month = monthStats[0] || {
        total: 0,
        manual: 0,
        auto: 0,
        replies: 0,
    };

    return {
        thisWeek: week,
        thisMonth: month,
        weeklyReplyRate:
            week.total > 0
                ? ((week.replies / week.total) * 100).toFixed(1)
                : "0",
        monthlyReplyRate:
            month.total > 0
                ? ((month.replies / month.total) * 100).toFixed(1)
                : "0",
    };
}
