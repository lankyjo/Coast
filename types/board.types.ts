export interface DailyBoard {
    _id: string;
    date: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface Comment {
    _id: string;
    taskId: string;
    userId: string;
    text: string;
    taggedUserIds: string[];
    createdAt: string;
    updatedAt: string;
    // Populated fields
    user?: {
        id: string;
        name: string;
        image?: string;
    };
}
