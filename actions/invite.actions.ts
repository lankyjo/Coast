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
export async function inviteMember(data: { email: string; role: "admin" | "member"; expertise?: string[] }) {
    await requireAdmin();
    await connectDB(); // Ensure DB connection is established

    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return { error: "Unauthorized" };
    }

    const { email, role, expertise } = data;

    // Check if user already exists
    const existingUser = await mongoose.connection.collection("user").findOne({ email });
    if (existingUser) {
        return { error: "User already exists" };
    }

    // Check for pending invite
    const existingInvite = await Invitation.findOne({
        email,
        status: "pending",
        expiresAt: { $gt: new Date() },
    });

    if (existingInvite) {
        return { error: "Invitation already sent" };
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    try {
        const invitation = await Invitation.create({
            email,
            role,
            expertise: expertise || [], // Save expertise array
            token,
            invitedBy: session.user.id,
            expiresAt,
        });

        // Send email
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invite?token=${token}`;

        // Format expertise for email
        const expertiseText = expertise && expertise.length > 0 ? ` with expertise in <strong>${expertise.join(", ")}</strong>` : "";

        const { error } = await resend.emails.send({
            from: "The Coast <noreply@davidcoast.com>",
            to: email,
            subject: "You've been invited to The Coast",
            html: `
                <div style="font-family: 'Inter', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px;">
                    <h2 style="color: #0A0A0A; font-weight: 600; margin-bottom: 8px;">The Coast</h2>
                    <p style="color: #737373; margin-bottom: 24px;">
                        You have been invited to join the team as a <strong>${role}</strong>${expertiseText}.
                    </p>
                    <a href="${inviteUrl}" style="display: inline-block; background: #0A0A0A; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500;">
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
import mongoose from "mongoose";

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
                expertise: invitation.expertise || [], // Pass expertise array
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
