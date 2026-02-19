import { connectDB } from "@/lib/db";
import { Prospect } from "@/models/prospect.model";
import { AutomationConfig } from "@/models/automation-config.model";
import { CrmTemplate } from "@/models/template.model";
import { sendEmail, renderMergeTags } from "@/lib/resend";
import * as CrmActivityService from "@/services/crm-activity.service";
import * as TemplateService from "@/services/template.service";
import mongoose from "mongoose";

/**
 * Get all automation configs
 */
export async function getConfigs() {
    await connectDB();

    const configs = await AutomationConfig.find()
        .populate("template_id", "name subject_line")
        .lean();

    return JSON.parse(JSON.stringify(configs));
}

/**
 * Update an automation config
 */
export async function updateConfig(
    id: string,
    data: { enabled?: boolean; template_id?: string; delay_days?: number }
) {
    await connectDB();

    const updates: Record<string, unknown> = {};
    if (data.enabled !== undefined) updates.enabled = data.enabled;
    if (data.template_id) {
        updates.template_id = new mongoose.Types.ObjectId(data.template_id);
    }
    if (data.delay_days !== undefined) updates.delay_days = data.delay_days;

    const config = await AutomationConfig.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true }
    ).lean();

    return JSON.parse(JSON.stringify(config));
}

/**
 * Seed default automation configs if none exist
 */
export async function seedDefaultConfigs() {
    await connectDB();

    const existing = await AutomationConfig.countDocuments();
    if (existing > 0) return;

    const defaults = [
        { trigger_name: "follow_up_day_3", delay_days: 3, enabled: true },
        { trigger_name: "follow_up_day_7", delay_days: 7, enabled: true },
        { trigger_name: "follow_up_day_14", delay_days: 14, enabled: true },
        { trigger_name: "follow_up_day_30", delay_days: 30, enabled: true },
        { trigger_name: "thank_you_responded", delay_days: 0, enabled: true },
        { trigger_name: "thank_you_won", delay_days: 0, enabled: true },
        { trigger_name: "thank_you_project_started", delay_days: 0, enabled: true },
        { trigger_name: "thank_you_referral", delay_days: 0, enabled: true },
    ];

    await AutomationConfig.insertMany(defaults);
}

/**
 * Process follow-ups — called on-demand (dashboard load or manual trigger)
 * Finds prospects due for their next follow-up and sends emails
 */
export async function processFollowUps(userId: string): Promise<{
    sent: number;
    skipped: number;
    errors: string[];
}> {
    await connectDB();

    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Get enabled follow-up configs
    const configs = await AutomationConfig.find({
        trigger_name: { $regex: /^follow_up_day_/ },
        enabled: true,
        template_id: { $exists: true, $ne: null },
    })
        .populate("template_id")
        .lean();

    if (configs.length === 0) return { sent, skipped, errors };

    // Sort by delay_days ascending
    configs.sort((a, b) => (a.delay_days || 0) - (b.delay_days || 0));

    // Find prospects that are contacted but haven't responded
    // and are not paused, not won/lost/project_started
    const prospects = await Prospect.find({
        contacted: true,
        responded: false,
        follow_up_paused: false,
        pipeline_stage: { $in: ["contacted", "follow_up"] },
        email: { $exists: true, $ne: "" },
    }).lean();

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const prospect of prospects) {
        // Rate limit: max 1 auto email per prospect per 24 hours
        if (prospect.last_auto_email_at && new Date(prospect.last_auto_email_at) > oneDayAgo) {
            skipped++;
            continue;
        }

        // Determine which follow-up step they're due for
        const step = prospect.follow_up_step || 0;
        const config = configs[step];

        if (!config) {
            // All follow-up steps exhausted — move to nurture
            if (step >= configs.length) {
                await Prospect.findByIdAndUpdate(prospect._id, {
                    pipeline_stage: "nurture",
                    nurture_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                });
            }
            skipped++;
            continue;
        }

        // Check if enough days have passed since last contact/follow-up
        const lastContactDate = prospect.last_auto_email_at || prospect.contacted_at;
        if (!lastContactDate) {
            skipped++;
            continue;
        }

        const daysSinceLastContact = Math.floor(
            (Date.now() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastContact < (config.delay_days || 0)) {
            skipped++;
            continue;
        }

        // Send the follow-up email
        const template = config.template_id as any;
        if (!template || !prospect.email) {
            skipped++;
            continue;
        }

        try {
            const mergeData = {
                owner_name: prospect.owner_name,
                business_name: prospect.business_name,
                category: prospect.category,
                assigned_to_name: "The Coast Team",
            };

            const subject = renderMergeTags(template.subject_line, mergeData);
            const html = renderMergeTags(template.body, mergeData);

            const result = await sendEmail({
                to: prospect.email,
                subject,
                html,
            });

            if (result.success) {
                // Update prospect
                await Prospect.findByIdAndUpdate(prospect._id, {
                    last_auto_email_at: new Date(),
                    follow_up_step: step + 1,
                    pipeline_stage: "follow_up",
                });

                // Log activity
                await CrmActivityService.logActivity({
                    prospect_id: prospect._id.toString(),
                    performed_by: userId,
                    activity_type: "auto_follow_up",
                    subject: `Auto follow-up #${step + 1} sent`,
                    details: `Template: ${template.name}`,
                    template_id: template._id?.toString(),
                    is_automated: true,
                });

                // Log template send
                await TemplateService.logTemplateSend({
                    template_id: template._id?.toString(),
                    prospect_id: prospect._id.toString(),
                    sent_by: userId,
                    is_automated: true,
                });

                sent++;
            } else {
                errors.push(`Failed to send to ${prospect.business_name}: ${result.error}`);
            }
        } catch (err) {
            errors.push(
                `Error processing ${prospect.business_name}: ${err instanceof Error ? err.message : "Unknown error"}`
            );
        }
    }

    return { sent, skipped, errors };
}

/**
 * Process auto thank-you for a specific trigger
 * Called immediately when a stage change happens
 */
export async function processThankYou(
    prospectId: string,
    triggerName: string,
    userId: string
): Promise<{ sent: boolean; error?: string }> {
    await connectDB();

    const config = await AutomationConfig.findOne({
        trigger_name: triggerName,
        enabled: true,
        template_id: { $exists: true, $ne: null },
    })
        .populate("template_id")
        .lean();

    if (!config) return { sent: false, error: "No config found or disabled" };

    const prospect = await Prospect.findById(prospectId).lean();
    if (!prospect || !prospect.email) {
        return { sent: false, error: "Prospect not found or no email" };
    }

    // Rate limit check
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    if (prospect.last_auto_email_at && new Date(prospect.last_auto_email_at) > oneDayAgo) {
        return { sent: false, error: "Rate limited — already sent today" };
    }

    const template = config.template_id as any;
    const mergeData = {
        owner_name: prospect.owner_name,
        business_name: prospect.business_name,
        category: prospect.category,
        assigned_to_name: "The Coast Team",
    };

    const subject = renderMergeTags(template.subject_line, mergeData);
    const html = renderMergeTags(template.body, mergeData);

    const result = await sendEmail({
        to: prospect.email,
        subject,
        html,
    });

    if (result.success) {
        await Prospect.findByIdAndUpdate(prospectId, {
            last_auto_email_at: new Date(),
        });

        await CrmActivityService.logActivity({
            prospect_id: prospectId,
            performed_by: userId,
            activity_type: "auto_thank_you",
            subject: `Auto thank-you sent (${triggerName.replace(/_/g, " ")})`,
            details: `Template: ${template.name}`,
            template_id: template._id?.toString(),
            is_automated: true,
        });

        await TemplateService.logTemplateSend({
            template_id: template._id?.toString(),
            prospect_id: prospectId,
            sent_by: userId,
            is_automated: true,
        });

        return { sent: true };
    }

    return { sent: false, error: result.error };
}
