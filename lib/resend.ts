import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "hello@admin.coastglobal.org";
const FROM_NAME = "The Coast";

export interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
    replyTo?: string;
}

/**
 * Send an email via Resend
 */
export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams) {
    try {
        const { data, error } = await resend.emails.send({
            from: `${FROM_NAME} <${FROM_EMAIL}>`,
            to,
            subject,
            html,
            replyTo,
        });

        if (error) {
            console.error("Resend error:", error);
            return { success: false, error: error.message };
        }

        return { success: true, id: data?.id };
    } catch (err) {
        console.error("Failed to send email:", err);
        return { success: false, error: "Failed to send email" };
    }
}

/**
 * Replace merge tags in a template string with prospect data
 */
export function renderMergeTags(
    text: string,
    data: {
        owner_name?: string;
        business_name?: string;
        category?: string;
        assigned_to_name?: string;
    }
): string {
    return text
        .replace(/\{\{owner_name\}\}/g, data.owner_name || "there")
        .replace(/\{\{business_name\}\}/g, data.business_name || "your business")
        .replace(/\{\{category\}\}/g, data.category || "")
        .replace(/\{\{assigned_to_name\}\}/g, data.assigned_to_name || "our team");
}
