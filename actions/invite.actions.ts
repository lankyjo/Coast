"use server";

import { connectDB } from "@/lib/db";
import { Invitation, IInvitation } from "@/models/invitation.model";
import { requireAdmin, requireAuth } from "./auth.actions";
import { resend } from "@/lib/resend";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

/**
 * List all pending invitations
 */
export async function getInvitations() {
    await requireAdmin();
    await connectDB();

    try {
        const invitations = await Invitation.find({ status: "pending" })
            .sort({ createdAt: -1 })
            .populate("invitedBy", "name email")
            .lean();

        return { success: true, data: JSON.parse(JSON.stringify(invitations)) };
    } catch (error) {
        console.error("Failed to fetch invitations:", error);
        return { error: "Failed to load invitations" };
    }
}

/**
 * Invite a new member
 */
export async function inviteMember(data: { email: string; role: "admin" | "member" }) {
    const session = await requireAdmin();
    await connectDB();

    const { email, role } = data;

    // Check for existing pending invitation
    const existingInvite = await Invitation.findOne({
        email,
        status: "pending",
        expiresAt: { $gt: new Date() },
    });

    if (existingInvite) {
        return { error: "An active invitation already exists for this email." };
    }

    // Generate token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    try {
        const invitation = await Invitation.create({
            email,
            role,
            token,
            invitedBy: session.user.id,
            expiresAt,
        });

        // Send email via Resend
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${token}`;

        // Log to console for easy testing in development
        console.log(`[INVITE URL]: ${inviteUrl}`);

        const { error } = await resend.emails.send({
            from: "The Coast <onboarding@resend.dev>", // Use onboarding@resend.dev if domain is not verified
            to: email,
            subject: "You've been invited to The Coast",
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>You've been invited to join The Coast</h2>
                    <p>You have been invited to join the team as a <strong>${role}</strong>.</p>
                    <p>Click the link below to accept your invitation:</p>
                    <a href="${inviteUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                        Accept Invitation
                    </a>
                    <p style="margin-top: 24px; color: #666; font-size: 14px;">This link expires in 7 days.</p>
                </div>
            `,
        });

        if (error) {
            console.error("Resend error:", error);
            await Invitation.findByIdAndDelete(invitation._id);
            // Return a more descriptive error if possible
            return { error: `Failed to send email: ${error.message || "Unknown Resend error"}. Make sure your sender domain is verified in Resend.` };
        }

        revalidatePath("/admin");
        return { success: true, data: JSON.parse(JSON.stringify(invitation)) };
    } catch (error) {
        console.error("Invite error:", error);
        return { error: "Failed to create invitation" };
    }
}

/**
 * Revoke an invitation
 */
export async function revokeInvitation(id: string) {
    await requireAdmin();
    await connectDB();

    try {
        await Invitation.findByIdAndDelete(id);
        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        return { error: "Failed to revoke invitation" };
    }
}

/**
 * Get invitation by token (public/auth access)
 */
export async function getInvitationByToken(token: string) {
    await connectDB();
    const invitation = await Invitation.findOne({
        token,
        status: "pending",
        expiresAt: { $gt: new Date() },
    }).lean();

    if (!invitation) return { error: "Invalid or expired invitation" };

    return { success: true, data: JSON.parse(JSON.stringify(invitation)) };
}

/**
 * Accept an invitation and create an account
 */
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function acceptInvitation(token: string, data: { name: string; password: string }) {
    await connectDB();

    // 1. Validate invitation
    const invitation = await Invitation.findOne({
        token,
        status: "pending",
        expiresAt: { $gt: new Date() },
    });

    if (!invitation) return { error: "Invalid or expired invitation" };

    // 2. Create user via Better Auth
    try {
        const user = await auth.api.signUpEmail({
            body: {
                email: invitation.email,
                password: data.password,
                name: data.name,
                role: invitation.role, // Pass the role from invitation
            },
            headers: await headers(),
        });

        if (!user) {
            return { error: "Failed to create account" };
        }

        // 3. Mark invitation as accepted
        invitation.status = "accepted";
        await invitation.save();

        return { success: true };
    } catch (error) {
        console.error("Accept invite error:", error);
        // @ts-ignore
        return { error: error?.message || "Failed to create account" };
    }
}
