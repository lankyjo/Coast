"use server";

import { connectDB } from "@/lib/db";
import { Invitation } from "@/models/invitation.model";
import { requireAdmin } from "./auth.actions";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth"; // Better Auth instance
import mongoose from "mongoose";

/**
 * Get all team members and pending invitations
 */
export async function getTeamData() {
    await requireAdmin();
    await connectDB();

    try {
        // Fetch users using Mongoose directly for speed/flexibility
        // Note: Better Auth uses 'user' collection. 
        // We assume 'User' model is set up to map to it.
        // If not, we can use mongoose.connection.collection("user").find()...

        // Let's use the defined User model if it matches BA schema.
        // In this project, we might not have a dedicated User model file matching BA exactly?
        // Let's check user.model.ts in a moment. If it doesn't exist, we use generic collection access.

        // Assuming User model exists or we use mongoose generic.
        // Let's use generic collection to be safe since BA manages schema.
        const users = await mongoose.connection.collection("user").find({}).toArray();

        // Fetch pending invitations
        const invitations = await Invitation.find({ status: "pending" })
            .sort({ createdAt: -1 })
            .lean();

        return {
            success: true,
            data: {
                members: JSON.parse(JSON.stringify(users)),
                invitations: JSON.parse(JSON.stringify(invitations)),
            },
        };
    } catch (error) {
        console.error("Failed to fetch team data:", error);
        return { error: "Failed to load team data" };
    }
}

/**
 * Update a member's role
 */
export async function updateMemberRole(userId: string, role: "admin" | "member") {
    const session = await requireAdmin();
    await connectDB();

    if (session.user.id === userId) {
        return { error: "You cannot change your own role." };
    }

    try {
        await mongoose.connection.collection("user").updateOne(
            { _id: new mongoose.Types.ObjectId(userId) }, // BA usually uses string IDs but MongoDB uses ObjectId. BA adapter config matters.
            // Better Auth MongoDB adapter typically stores _id as string or user passes it.
            // Let's check how we seeded. We used string IDs in seed? No, default Mongo IDs.
            // But BA user IDs are strings in session.
            // Mongoose adapter converts them? 
            // Usually safest to try string first? 
            // Actually, BA generic adapter uses string IDs. MongoDB adapter uses ObjectId or string depending on config.
            // Let's assume ObjectId for MongoDB native, OR string if BA generated it.
            // I'll try both or just rely on `auth.api.updateUser`?
            // `auth.api` is safer.
            { $set: { role } }
        );

        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        return { error: "Failed to update role" };
    }
}

/**
 * Remove a member
 */
export async function removeMember(userId: string) {
    const session = await requireAdmin();
    await connectDB();

    if (session.user.id === userId) {
        return { error: "You cannot remove yourself." };
    }

    try {
        // We can use direct DB or BA api.
        // Direct DB
        await mongoose.connection.collection("user").deleteOne({
            _id: new mongoose.Types.ObjectId(userId)
        });

        // Also delete their sessions?
        await mongoose.connection.collection("session").deleteMany({
            userId: userId // Session userId is string or ObjectId?
        });

        revalidatePath("/admin");
        return { success: true };
    } catch (error) {
        // Try with string ID if ObjectId failed? 
        try {
            await mongoose.connection.collection("user").deleteOne({ _id: userId as any });
            return { success: true };
        } catch {
            return { error: "Failed to remove member" };
        }
    }
}
