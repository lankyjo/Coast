export type ProjectStatus = "active" | "completed" | "on_hold" | "archived";

export interface Attachment {
    name: string;
    url: string;
    type: string;
    uploadedBy: string;
    uploadedAt: string;
}

export interface Project {
    _id: string;
    name: string;
    description: string;
    status: ProjectStatus;
    deadline: string;
    startDate: string;
    progress: number;
    createdBy: string;
    tags: string[];
    shareToken?: string;
    attachments: Attachment[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateProjectInput {
    name: string;
    description: string;
    deadline: string;
    startDate: string;
    tags?: string[];
}

export interface UpdateProjectInput {
    name?: string;
    description?: string;
    status?: ProjectStatus;
    deadline?: string;
    tags?: string[];
}
