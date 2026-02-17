import { NextResponse } from "next/server";
import { Notification } from "@/models/notification.model";
import { connectDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        await connectDB();

        // Delete all notifications where read: true
        const result = await Notification.deleteMany({ read: true });

        return NextResponse.json({
            success: true,
            message: `Deleted ${result.deletedCount} read notifications`,
            deletedCount: result.deletedCount
        });
    } catch (error: any) {
        console.error("Failed to clean up notifications:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
