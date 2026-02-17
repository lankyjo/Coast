export interface AISuggestion {
    suggestedMemberId: string;
    memberName: string;
    reasoning: string;
    confidenceScore: number; // 0-100
}

export interface AITaskBreakdown {
    subtasks: {
        title: string;
        estimatedMinutes?: number;
    }[];
    totalEstimatedHours: number;
}

export interface AIDeadlineSuggestion {
    suggestedDeadline: string; // ISO date
    reasoning: string;
    difficultyScore: number; // 1-10
}

export interface AIDailyKeyPoint {
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
    relatedTaskId?: string;
}

export interface AIEODReport {
    date: string;
    summary: string;
    memberReports: {
        memberId: string;
        memberName: string;
        tasksCompleted: number;
        tasksInProgress: number;
        highlights: string[];
        blockers: string[];
    }[];
    overallProgress: string;
}

// ─── Project Planning ───────────────────────────────────────

export interface SmartProjectTask {
    title: string;
    description: string;
    priority: "low" | "medium" | "high" | "urgent";
    estimatedHours: number;
    suggestedAssigneeName?: string;
    role?: string;
    subtasks?: { title: string }[];
}

export interface SmartProjectPhase {
    name: string;
    tasks: SmartProjectTask[];
}

export interface SmartProjectPlan {
    projectTitle: string;
    description: string;
    phases: SmartProjectPhase[];
    reasoning: string;
}
