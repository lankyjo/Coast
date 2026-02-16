export const TASK_STATUS = {
    TODO: "todo",
    IN_PROGRESS: "in_progress",
    IN_REVIEW: "in_review",
    DONE: "done",
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
    todo: "To Do",
    in_progress: "In Progress",
    in_review: "In Review",
    done: "Done",
};

export const TASK_STATUS_ORDER: TaskStatus[] = [
    "todo",
    "in_progress",
    "in_review",
    "done",
];
