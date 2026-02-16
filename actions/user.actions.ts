"use server";

import { requireAuth } from "./auth.actions";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

export async function getUsers() {
    await requireAuth();
    await connectDB();

    try {
        // Direct MongoDB access to the "user" collection managed by Better Auth
        const users = await mongoose.connection.collection("user").find({}, {
            projection: {
                id: 1,
                name: 1,
                email: 1,
                image: 1,
                role: 1,
                expertise: 1,
            }
        }).toArray();

        // Map _id to id if necessary, though direct query is cleaner
        return {
            success: true,
            data: users.map(u => ({
                id: u._id.toString(),
                name: u.name,
                email: u.email,
                image: u.image,
                role: u.role,
                expertise: u.expertise,
            }))
        };
    } catch (error) {
        console.error("Failed to fetch users:", error);
        return { error: "Failed to fetch users" };
    }
}
