"use server";

import { connectDB } from "@/lib/db";
import { Invitation, IInvitation } from "@/models/invitation.model";
import { requireAdmin, requireAuth } from "./auth.actions";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import mongoose from "mongoose";

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
 * Invite a new member — generates a one-time invite link (no email sent)
 */
export async function inviteMember(data: { email: string; role: "admin" | "member"; expertise?: string[] }) {
    await requireAdmin();
    await connectDB();

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
        // Return existing link instead of blocking
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${existingInvite.token}`;
        return { success: true, inviteUrl, data: JSON.parse(JSON.stringify(existingInvite)) };
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    try {
        const invitation = await Invitation.create({
            email,
            role,
            expertise: expertise || [],
            token,
            invitedBy: session.user.id,
            expiresAt,
        });

        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${token}`;

        revalidatePath("/admin");
        return { success: true, inviteUrl, data: JSON.parse(JSON.stringify(invitation)) };
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

    if (!token || typeof token !== "string" || token.length > 100) {
        return { error: "Invalid token" };
    }

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
export async function acceptInvitation(token: string, data: { name: string; password: string }) {
    await connectDB();

    if (!token || typeof token !== "string" || token.length > 100) {
        return { error: "Invalid token" };
    }

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
                role: invitation.role,
                expertise: invitation.expertise || [],
            },
            headers: await headers(),
        });

        if (!user) {
            return { error: "Failed to create account" };
        }

        // 3. Mark invitation as accepted (one-time use)
        invitation.status = "accepted";
        await invitation.save();

        return { success: true };
    } catch (error) {
        console.error("Accept invite error:", error);
        // @ts-ignore
        return { error: error?.message || "Failed to create account" };
    }
}
