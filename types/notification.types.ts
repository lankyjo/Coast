export type NotificationType =
    | "task_assigned"
    | "task_completed"
    | "deadline_warning"
    | "eod_report"
    | "member_joined";

export interface NotificationMetadata {
    taskId?: string;
    projectId?: string;
    triggeredBy?: string;
}

export interface Notification {
    _id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    metadata: NotificationMetadata;
    createdAt: string;
}
