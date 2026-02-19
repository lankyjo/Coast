"use server";

import { requireAdmin } from "./auth.actions";
import * as TemplateService from "@/services/template.service";
import * as CrmActivityService from "@/services/crm-activity.service";
import { sendEmail, renderMergeTags } from "@/lib/resend";
import { Prospect } from "@/models/prospect.model";
import { connectDB } from "@/lib/db";
import type { TemplateCategory } from "@/types/crm.types";

/**
 * Create a new email template
 */
export async function createTemplate(data: {
    name: string;
    subject_line: string;
    body: string;
    category: TemplateCategory;
    target_industry?: string;
    is_auto_template?: boolean;
    auto_trigger?: string;
    tags?: string[];
}) {
    const session = await requireAdmin();

    try {
        const template = await TemplateService.createTemplate(
            data,
            session.user.id
        );
        return { success: true, data: template };
    } catch (error) {
        console.error("Failed to create template:", error);
        return { error: "Failed to create template" };
    }
}

/**
 * Update a template
 */
export async function updateTemplate(
    id: string,
    data: Partial<{
        name: string;
        subject_line: string;
        body: string;
        category: TemplateCategory;
        target_industry: string;
        is_auto_template: boolean;
        auto_trigger: string;
        tags: string[];
    }>
) {
    await requireAdmin();

    try {
        const template = await TemplateService.updateTemplate(id, data);
        if (!template) return { error: "Template not found" };
        return { success: true, data: template };
    } catch (error) {
        return { error: "Failed to update template" };
    }
}

/**
 * Delete a template
 */
export async function deleteTemplate(id: string) {
    await requireAdmin();

    try {
        const deleted = await TemplateService.deleteTemplate(id);
        if (!deleted) return { error: "Template not found" };
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete template" };
    }
}

/**
 * Get all templates
 */
export async function getTemplates(filters?: {
    category?: string;
    is_auto_template?: boolean;
    target_industry?: string;
}) {
    await requireAdmin();

    try {
        const templates = await TemplateService.getTemplates(filters);
        return { success: true, data: templates };
    } catch (error) {
        return { error: "Failed to fetch templates" };
    }
}

/**
 * Get a single template
 */
export async function getTemplate(id: string) {
    await requireAdmin();

    try {
        const template = await TemplateService.getTemplateById(id);
        if (!template) return { error: "Template not found" };
        return { success: true, data: template };
    } catch (error) {
        return { error: "Failed to fetch template" };
    }
}

/**
 * Send an email using a template to a prospect
 */
export async function sendTemplateEmail(data: {
    template_id: string;
    prospect_id: string;
    customSubject?: string;
    customBody?: string;
}) {
    const session = await requireAdmin();
    await connectDB();

    try {
        const [template, prospect] = await Promise.all([
            TemplateService.getTemplateById(data.template_id),
            Prospect.findById(data.prospect_id)
                .populate("assigned_to", "name")
                .lean(),
        ]);

        if (!template) return { error: "Template not found" };
        if (!prospect) return { error: "Prospect not found" };
        if (!prospect.email) return { error: "Prospect has no email address" };

        const mergeData = {
            owner_name: prospect.owner_name,
            business_name: prospect.business_name,
            category: prospect.category,
            assigned_to_name:
                (prospect.assigned_to as any)?.name || "The Coast Team",
        };

        const subject = renderMergeTags(
            data.customSubject || template.subject_line,
            mergeData
        );
        const html = renderMergeTags(
            data.customBody || template.body,
            mergeData
        );

        const result = await sendEmail({
            to: prospect.email,
            subject,
            html,
        });

        if (!result.success) return { error: result.error };

        // Log to template_sends
        await TemplateService.logTemplateSend({
            template_id: data.template_id,
            prospect_id: data.prospect_id,
            sent_by: session.user.id,
            is_automated: false,
        });

        // Log as CRM activity
        await CrmActivityService.logActivity({
            prospect_id: data.prospect_id,
            performed_by: session.user.id,
            activity_type: "email_sent",
            subject: `Email sent: ${subject}`,
            details: `Template: ${template.name}`,
            template_id: data.template_id,
        });

        return { success: true };
    } catch (error) {
        console.error("Failed to send email:", error);
        return { error: "Failed to send email" };
    }
}

/**
 * Get template performance stats
 */
export async function getTemplatePerformanceStats() {
    await requireAdmin();

    try {
        const stats = await TemplateService.getTemplatePerformanceStats();
        return { success: true, data: stats };
    } catch (error) {
        return { error: "Failed to fetch template stats" };
    }
}

/**
 * Get overall outreach stats
 */
export async function getOutreachStats() {
    await requireAdmin();

    try {
        const stats = await TemplateService.getOverallOutreachStats();
        return { success: true, data: stats };
    } catch (error) {
        return { error: "Failed to fetch outreach stats" };
    }
}

/**
 * Update a send's status (replied, etc.)
 */
export async function updateSendStatus(
    sendId: string,
    status: "opened" | "replied" | "bounced",
    sentiment?: "positive" | "neutral" | "negative"
) {
    await requireAdmin();

    try {
        const send = await TemplateService.updateSendStatus(sendId, status, sentiment);
        if (!send) return { error: "Send record not found" };
        return { success: true, data: send };
    } catch (error) {
        return { error: "Failed to update send status" };
    }
}
