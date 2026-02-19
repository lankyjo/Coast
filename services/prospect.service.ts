import { connectDB } from "@/lib/db";
import { Prospect, IProspect } from "@/models/prospect.model";
import type { ProspectFilters, ProspectSort } from "@/types/crm.types";
import mongoose from "mongoose";

/**
 * Create a new prospect
 */
export async function createProspect(
    data: Partial<IProspect>,
    userId: string
): Promise<IProspect> {
    await connectDB();

    const prospect = await Prospect.create({
        ...data,
        inputted_by: new mongoose.Types.ObjectId(userId),
        assigned_to: data.assigned_to || new mongoose.Types.ObjectId(userId),
        pipeline_stage: data.pipeline_stage || "new_lead",
        lead_source: data.lead_source || "Manual",
    });

    return prospect;
}

/**
 * Update a prospect
 */
export async function updateProspect(
    id: string,
    data: Partial<IProspect>
): Promise<IProspect | null> {
    await connectDB();

    const prospect = await Prospect.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
    )
        .populate("inputted_by", "name image")
        .populate("assigned_to", "name image")
        .lean();

    return prospect as IProspect | null;
}

/**
 * Delete a prospect
 */
export async function deleteProspect(id: string): Promise<boolean> {
    await connectDB();
    const result = await Prospect.findByIdAndDelete(id);
    return !!result;
}

/**
 * Get a single prospect by ID with populated refs
 */
export async function getProspectById(id: string): Promise<IProspect | null> {
    await connectDB();

    const prospect = await Prospect.findById(id)
        .populate("inputted_by", "name email image")
        .populate("assigned_to", "name email image")
        .lean();

    return prospect as IProspect | null;
}

/**
 * Get prospects with filters, search, sort, and pagination
 */
export async function getProspects(options: {
    filters?: Partial<ProspectFilters>;
    sort?: ProspectSort;
    page?: number;
    limit?: number;
}): Promise<{
    prospects: IProspect[];
    total: number;
    page: number;
    totalPages: number;
}> {
    await connectDB();

    const { filters, sort, page = 1, limit = 50 } = options;
    const query: Record<string, unknown> = {};

    // Build filter query
    if (filters) {
        if (filters.market && filters.market !== "all") {
            query.market = filters.market;
        }
        if (filters.category && filters.category !== "all") {
            query.category = filters.category;
        }
        if (filters.pipeline_stage && filters.pipeline_stage !== "all") {
            query.pipeline_stage = filters.pipeline_stage;
        }
        if (filters.contacted && filters.contacted !== "all") {
            query.contacted = filters.contacted === "yes";
        }
        if (filters.responded && filters.responded !== "all") {
            query.responded = filters.responded === "yes";
        }
        if (filters.deal_closed && filters.deal_closed !== "all") {
            query.deal_closed = filters.deal_closed === "yes";
        }
        if (filters.lead_source && filters.lead_source !== "all") {
            query.lead_source = filters.lead_source;
        }
        if (filters.assigned_to && filters.assigned_to !== "all" && filters.assigned_to !== "mine") {
            query.assigned_to = new mongoose.Types.ObjectId(filters.assigned_to);
        }
        if (
            filters.weakness_score_min !== undefined ||
            filters.weakness_score_max !== undefined
        ) {
            query.weakness_score = {};
            if (filters.weakness_score_min !== undefined) {
                (query.weakness_score as Record<string, number>).$gte = filters.weakness_score_min;
            }
            if (filters.weakness_score_max !== undefined) {
                (query.weakness_score as Record<string, number>).$lte = filters.weakness_score_max;
            }
        }
        if (filters.search) {
            query.$text = { $search: filters.search };
        }
    }

    // Sort
    const sortObj: Record<string, 1 | -1> = {};
    if (sort) {
        sortObj[sort.field] = sort.direction === "asc" ? 1 : -1;
    } else {
        sortObj.weakness_score = -1; // Default: highest weakness first
    }

    const skip = (page - 1) * limit;

    const [prospects, total] = await Promise.all([
        Prospect.find(query)
            .sort(sortObj)
            .skip(skip)
            .limit(limit)
            .populate("inputted_by", "name image")
            .populate("assigned_to", "name image")
            .lean(),
        Prospect.countDocuments(query),
    ]);

    return {
        prospects: prospects as IProspect[],
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Get prospect counts grouped by pipeline stage
 */
export async function getProspectStats() {
    await connectDB();

    const [stageCounts, totalStats] = await Promise.all([
        Prospect.aggregate([
            { $group: { _id: "$pipeline_stage", count: { $sum: 1 } } },
        ]),
        Prospect.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    contacted: {
                        $sum: { $cond: ["$contacted", 1, 0] },
                    },
                    responded: {
                        $sum: { $cond: ["$responded", 1, 0] },
                    },
                    deals_won: {
                        $sum: { $cond: ["$deal_closed", 1, 0] },
                    },
                    projects_started: {
                        $sum: { $cond: ["$project_started", 1, 0] },
                    },
                },
            },
        ]),
    ]);

    const stageMap: Record<string, number> = {};
    for (const item of stageCounts) {
        stageMap[item._id] = item.count;
    }

    const stats = totalStats[0] || {
        total: 0,
        contacted: 0,
        responded: 0,
        deals_won: 0,
        projects_started: 0,
    };

    return {
        stages: stageMap,
        total: stats.total,
        contacted: stats.contacted,
        responded: stats.responded,
        deals_won: stats.deals_won,
        projects_started: stats.projects_started,
        conversion_rate:
            stats.contacted > 0
                ? ((stats.deals_won / stats.contacted) * 100).toFixed(1)
                : "0",
    };
}

/**
 * Bulk update prospects (stage, assign, add tags)
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
    await connectDB();

    const objectIds = ids.map((id) => new mongoose.Types.ObjectId(id));
    const updateObj: Record<string, unknown> = {};

    if (updates.pipeline_stage) {
        updateObj.pipeline_stage = updates.pipeline_stage;
    }
    if (updates.assigned_to) {
        updateObj.assigned_to = new mongoose.Types.ObjectId(updates.assigned_to);
    }
    if (updates.contacted !== undefined) {
        updateObj.contacted = updates.contacted;
        if (updates.contacted) {
            updateObj.contacted_at = new Date();
        }
    }

    const bulkUpdate: Record<string, unknown> = { $set: updateObj };

    if (updates.addTags && updates.addTags.length > 0) {
        bulkUpdate.$addToSet = { tags: { $each: updates.addTags } };
    }

    const result = await Prospect.updateMany(
        { _id: { $in: objectIds } },
        bulkUpdate
    );

    return { modifiedCount: result.modifiedCount };
}

/**
 * Import prospects from parsed CSV data
 */
export async function importProspects(
    rows: Partial<IProspect>[],
    userId: string
): Promise<{ imported: number; skipped: number; errors: string[] }> {
    await connectDB();

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
        try {
            // Check for duplicate by business_name + market
            const exists = await Prospect.findOne({
                business_name: row.business_name,
                market: row.market || "Other",
            }).lean();

            if (exists) {
                skipped++;
                continue;
            }

            await Prospect.create({
                ...row,
                inputted_by: new mongoose.Types.ObjectId(userId),
                assigned_to: row.assigned_to || new mongoose.Types.ObjectId(userId),
                lead_source: "CSV Import",
                pipeline_stage: row.pipeline_stage || "new_lead",
            });

            imported++;
        } catch (err) {
            errors.push(
                `Failed to import ${row.business_name}: ${err instanceof Error ? err.message : "Unknown error"}`
            );
        }
    }

    return { imported, skipped, errors };
}
