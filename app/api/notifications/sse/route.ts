import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { connectDB } from "@/lib/db";
import { Notification } from "@/models/notification.model";

export const dynamic = "force-dynamic";

export async function GET() {
    // Authenticate the user
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            // Track the last check time to only send new notifications
            let lastCheck = new Date();

            const sendEvent = (data: any) => {
                try {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
                    );
                } catch {
                    // Stream may be closed
                }
            };

            // Send initial heartbeat
            sendEvent({ type: "connected", timestamp: new Date().toISOString() });

            // Poll for new notifications every 5 seconds
            const interval = setInterval(async () => {
                try {
                    await connectDB();
                    const newNotifications = await Notification.find({
                        userId,
                        createdAt: { $gt: lastCheck },
                    })
                        .sort({ createdAt: -1 })
                        .limit(10)
                        .lean();

                    if (newNotifications.length > 0) {
                        lastCheck = new Date();
                        sendEvent({
                            type: "notifications",
                            data: JSON.parse(JSON.stringify(newNotifications)),
                        });
                    }
                } catch (error) {
                    console.error("SSE poll error:", error);
                }
            }, 5000);

            // Cleanup on abort
            const abortHandler = () => {
                clearInterval(interval);
                try {
                    controller.close();
                } catch {
                    // Already closed
                }
            };

            // Note: We use a timeout as a safety net since we can't access the request signal directly
            // The client EventSource will reconnect if the connection drops
            const timeout = setTimeout(() => {
                clearInterval(interval);
                try {
                    controller.close();
                } catch {
                    // Already closed
                }
            }, 5 * 60 * 1000); // Close after 5 minutes, client will reconnect

            // Store cleanup for potential external abort
            (controller as any)._cleanup = () => {
                clearInterval(interval);
                clearTimeout(timeout);
            };
        },
        cancel() {
            // Stream was cancelled by the client
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        },
    });
}
