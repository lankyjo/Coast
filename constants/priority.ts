export const PRIORITY = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    URGENT: "urgent",
} as const;

export type Priority = (typeof PRIORITY)[keyof typeof PRIORITY];

export const PRIORITY_LABELS: Record<Priority, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    urgent: "Urgent",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
    low: "var(--priority-low)",
    medium: "var(--priority-medium)",
    high: "var(--priority-high)",
    urgent: "var(--priority-urgent)",
};

export const PRIORITY_ORDER: Priority[] = ["urgent", "high", "medium", "low"];
