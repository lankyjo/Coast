import { TaskStatus } from "@/constants/task-status";
import { Priority } from "@/constants/priority";
import { Attachment } from "./project.types";

export interface Subtask {
    _id: string;
    title: string;
    done: boolean;
    completedAt?: string;
}

export interface TimeEntry {
    _id: string;
    userId: string;
    startTime: string;
    endTime?: string;
    duration: number; // minutes
    note?: string;
}

export interface AIMetadata {
    suggestedAssignee?: string;
    suggestedDeadline?: string;
    difficultyScore?: number; // 1-10
    reasoning?: string;
}

export interface Task {
    _id: string;
    title: string;
    description: string;
    projectId: string;
    assigneeId: string;
    assignedBy: string;
    status: TaskStatus;
    priority: Priority;
    deadline: string;
    estimatedHours?: number;
    subtasks: Subtask[];
    attachments: Attachment[];
    aiMetadata: AIMetadata;
    timeEntries: TimeEntry[];
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTaskInput {
    title: string;
    description: string;
    projectId: string;
    assigneeId?: string;
    priority: Priority;
    deadline?: string;
}

export interface UpdateTaskInput {
    title?: string;
    description?: string;
    assigneeId?: string;
    status?: TaskStatus;
    priority?: Priority;
    deadline?: string;
}

export interface TaskFilters {
    status: TaskStatus | "all";
    priority: Priority | "all";
    assignee: string | "all";
    project: string | "all";
    search: string;
}
