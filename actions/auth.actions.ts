"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { connectDB } from "@/lib/db";

/**
 * Get the current authenticated session (server-side)
 */
export async function getSession() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    return session;
}

/**
 * Require authentication — throws if not authenticated
 */
export async function requireAuth() {
    const session = await getSession();
    if (!session) {
        throw new Error("Unauthorized");
    }
    return session;
}

/**
 * Require admin role — throws if not admin
 */
export async function requireAdmin() {
    const session = await requireAuth();
    if (session.user.role !== "admin") {
        throw new Error("Forbidden: Admin access required");
    }
    return session;
}

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
    const session = await getSession();
    return session?.user?.role === "admin";
}

/**
 * Invite a new member to the organization
 */
export async function inviteMember(data: {
    email: string;
    name: string;
    expertise: string;
}) {
    await requireAdmin();
    await connectDB();

    // Create the invitation via Better Auth
    const result = await auth.api.createInvitation({
        body: {
            email: data.email,
            role: "member",
        },
        headers: await headers(),
    });

    return result;
}
