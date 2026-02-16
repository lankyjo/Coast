"use client";

import { useEffect, useRef } from "react";
import { useNotificationStore } from "@/stores/notification.store";
import { INotification } from "@/models/notification.model";

export function useNotifications() {
    const { fetchNotifications, addNotification } = useNotificationStore();
    const eventSourceRef = useRef<EventSource | null>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Initial fetch of all notifications
        fetchNotifications();

        // Reliable polling — refetch every 5 seconds for near-instant updates
        pollIntervalRef.current = setInterval(() => {
            fetchNotifications();
        }, 5000);

        // SSE for instant delivery (bonus, not required)
        const connectSSE = () => {
            try {
                if (eventSourceRef.current) {
                    eventSourceRef.current.close();
                }

                const source = new EventSource("/api/notifications/sse");
                eventSourceRef.current = source;

                source.onmessage = (event) => {
                    try {
                        const parsed = JSON.parse(event.data);
                        if (parsed.type === "notifications" && parsed.data) {
                            parsed.data.forEach((notification: INotification) => {
                                addNotification(notification);
                            });
                        }
                    } catch (error) {
                        console.error("Failed to parse SSE data:", error);
                    }
                };

                source.onerror = () => {
                    source.close();
                    eventSourceRef.current = null;
                    // SSE failed — polling is still running, so just retry SSE later
                    setTimeout(connectSSE, 30000);
                };
            } catch {
                // SSE not supported or failed to connect — polling handles it
            }
        };

        connectSSE();

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
}
