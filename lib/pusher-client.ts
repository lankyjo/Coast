import PusherClient from "pusher-js";

export const pusherClient = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    authEndpoint: "/api/pusher/auth",
    auth: {
        headers: {
            // Add any custom headers if needed, cookies valid automatically for same-origin
        },
    },
});
