import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { auth } from "@/lib/auth";
import mongoose from "mongoose";
import { headers } from "next/headers";

export async function GET() {
    await connectDB();

    // Check if any users exist using direct DB access
    // This avoids permission issues with auth.api.listUsers when no one is logged in
    const userCount = await mongoose.connection.collection("user").countDocuments();

    if (userCount > 0) {
        return NextResponse.json(
            { error: "Users already exist. Seeding aborted." },
            { status: 400 }
        );
    }

    // Create the first admin user
    // We pass headers to satisfy Better Auth's need for request context (IP, user agent, etc.)
    const result = await auth.api.signUpEmail({
        body: {
            email: "admin@davidcoast.com",
            password: "password123",
            name: "Admin User",
        },
        headers: await headers(),
    });

    if (!result) {
        return NextResponse.json(
            { error: "Failed to create admin user." },
            { status: 500 }
        );
    }

    // Manually update the user to be an admin and set expertise
    // (Startups often separate signup from profile setting, so we force it here)
    await mongoose.connection.collection("user").updateOne(
        { email: "admin@davidcoast.com" },
        {
            $set: {
                role: "admin",
                expertise: "Project Management"
            }
        }
    );

    return NextResponse.json({
        message: "Admin user created successfully.",
        credentials: {
            email: "admin@davidcoast.com",
            password: "password123",
        },
        note: "Please change this password immediately after login.",
    });
}
