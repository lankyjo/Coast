import { auth } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";
import { headers } from "next/headers";

export async function POST(req: Request) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return new Response("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const socketId = formData.get("socket_id") as string;
    const channel = formData.get("channel_name") as string;

    // Security check: Ensure user is only subscribing to their own channel
    // Expected channel format: private-user-{userId}
    const userId = session.user.id;
    const expectedChannel = `private-user-${userId}`;

    if (channel !== expectedChannel) {
        // Allow checking for general 'presence-online' later if needed, but for now strict.
        // If we use presence channels, logic differs. Sticking to private user channel.
        return new Response("Unauthorized channel access", { status: 403 });
    }

    const authResponse = pusherServer.authorizeChannel(socketId, channel);
    return Response.json(authResponse);
}
