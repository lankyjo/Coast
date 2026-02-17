"use server";

import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { requireAuth, requireAdmin } from "./auth.actions";
import { connectDB } from "@/lib/db";
import { Task } from "@/models/task.model";
import mongoose from "mongoose";

// ─── Schemas ────────────────────────────────────────────────

const taskSchema = z.object({
    title: z.string().describe("Clear, concise title for the task"),
    description: z.string().describe("Detailed description of what needs to be done"),
    priority: z.enum(["low", "medium", "high", "urgent"]).describe("Priority level based on urgency and impact"),
    subtasks: z.array(z.string()).describe("List of subtasks to complete the main task"),
    estimatedHours: z.number().optional().describe("Estimated hours to complete the task"),
    deadline: z.string().optional().describe("ISO date string for the deadline, if mentioned"),
});

const assigneeSuggestionSchema = z.object({
    suggestedMemberId: z.string().describe("The ID of the best-fit team member"),
    memberName: z.string().describe("Name of the suggested member"),
    reasoning: z.string().describe("Why this member is the best fit for this task"),
    confidenceScore: z.number().min(0).max(100).describe("Confidence score from 0-100"),
});

const taskBreakdownSchema = z.object({
    subtasks: z.array(z.object({
        title: z.string().describe("Clear, actionable subtask title"),
        estimatedMinutes: z.number().optional().describe("Estimated minutes to complete"),
    })).describe("List of subtasks"),
    totalEstimatedHours: z.number().describe("Total estimated hours for all subtasks"),
});

const deadlineSuggestionSchema = z.object({
    suggestedDeadline: z.string().describe("ISO date string for the suggested deadline"),
    reasoning: z.string().describe("Why this deadline was chosen"),
    difficultyScore: z.number().min(1).max(10).describe("Difficulty score from 1-10"),
});

const dailyKeyPointsSchema = z.object({
    keyPoints: z.array(z.object({
        title: z.string().describe("Brief title for the key point"),
        description: z.string().describe("Short explanation"),
        priority: z.enum(["high", "medium", "low"]).describe("Priority level"),
    })).describe("List of daily key points and insights"),
});

const eodReportSchema = z.object({
    summary: z.string().describe("Overall daily summary"),
    memberReports: z.array(z.object({
        memberName: z.string().describe("Team member name"),
        memberId: z.string().describe("Team member ID"),
        tasksCompleted: z.number().describe("Number of tasks completed today"),
        tasksInProgress: z.number().describe("Number of tasks currently in progress"),
        highlights: z.array(z.string()).describe("Key accomplishments"),
        blockers: z.array(z.string()).describe("Any blockers or issues"),
    })).describe("Per-member breakdown"),
    overallProgress: z.string().describe("Overall team progress assessment"),
});

// ─── Helpers ────────────────────────────────────────────────

async function getTeamContext() {
    await connectDB();
    const users = await mongoose.connection.collection("user").find({}).toArray();

    // Get task counts per user
    const taskCounts = await Task.aggregate([
        { $match: { status: { $ne: "done" } } },
        { $unwind: "$assigneeIds" },
        { $group: { _id: "$assigneeIds", count: { $sum: 1 } } },
    ]);

    const countMap = new Map(taskCounts.map((t: any) => [t._id.toString(), t.count]));

    return users.map((u: any) => ({
        id: u._id.toString(),
        name: u.name || "Unknown",
        email: u.email,
        expertise: Array.isArray(u.expertise) ? u.expertise.join(", ") : (u.expertise || "General"),
        role: u.role || "member",
        activeTasks: countMap.get(u._id.toString()) || 0,
    }));
}

const SYSTEM_PROMPT = `You are an AI assistant for Coast, a brand design studio's project management tool. 
The team works on branding, design, web development, and creative projects. 
Always provide practical, actionable responses in the requested JSON format.
Today's date is ${new Date().toISOString().split("T")[0]}.`;

// ─── Actions ────────────────────────────────────────────────

export async function generateTaskFromInput(input: string) {
    await requireAuth();

    try {
        const { output: taskData } = await generateText({
            model: google("gemini-2.5-flash"),
            output: Output.object({ schema: taskSchema }),
            prompt: `
            ${SYSTEM_PROMPT}
            Analyze the following request and generate a structured task.
            Identify subtasks if the request implies multiple steps.
            Infer priority based on words like "asap", "urgent", "whenever".
            
            Request: "${input}"
            `,
        });

        return { success: true, data: taskData };
    } catch (error: any) {
        console.error("AI generation failed:", error);
        return { success: false, error: `Failed to generate task. ${error?.message || ""}` };
    }
}

export async function suggestAssignee(
    taskTitle: string,
    taskDescription: string,
    projectId?: string
) {
    await requireAuth();

    try {
        const team = await getTeamContext();

        if (team.length === 0) {
            return { success: false, error: "No team members found" };
        }

        const teamContext = team.map((m) =>
            `- ${m.name} (ID: ${m.id}): Expertise: ${m.expertise}, Active tasks: ${m.activeTasks}, Role: ${m.role}`
        ).join("\n");

        const { output } = await generateText({
            model: google("gemini-2.5-flash"),
            output: Output.object({ schema: assigneeSuggestionSchema }),
            prompt: `
            ${SYSTEM_PROMPT}
            
            Based on the task details and the team's expertise and current workload, suggest the best team member to assign this task to.
            
            Task Title: "${taskTitle}"
            Task Description: "${taskDescription}"
            
            Available Team Members:
            ${teamContext}
            
            Consider:
            1. Expertise match with the task requirements
            2. Current workload (prefer members with fewer active tasks)
            3. Role suitability
            
            Return the suggestedMemberId as the exact ID string from the list above.
            `,
        });

        return { success: true, data: output };
    } catch (error: any) {
        console.error("AI suggest assignee failed:", error);
        return { success: false, error: `Failed to suggest assignee. ${error?.message || ""}` };
    }
}

export async function breakDownTask(taskTitle: string, taskDescription: string) {
    await requireAuth();

    try {
        const { output } = await generateText({
            model: google("gemini-2.5-flash"),
            output: Output.object({ schema: taskBreakdownSchema }),
            prompt: `
            ${SYSTEM_PROMPT}
            
            Break down the following task into smaller, actionable subtasks.
            Each subtask should be specific and completable in one work session.
            Estimate the time needed for each subtask in minutes.
            
            Task Title: "${taskTitle}"
            Task Description: "${taskDescription}"
            
            Provide 3-8 subtasks depending on complexity.
            `,
        });

        return { success: true, data: output };
    } catch (error: any) {
        console.error("AI break down task failed:", error);
        return { success: false, error: `Failed to break down task. ${error?.message || ""}` };
    }
}

export async function suggestDeadline(
    taskTitle: string,
    taskDescription: string,
    priority: string
) {
    await requireAuth();

    try {
        const { output } = await generateText({
            model: google("gemini-2.5-flash"),
            output: Output.object({ schema: deadlineSuggestionSchema }),
            prompt: `
            ${SYSTEM_PROMPT}
            
            Suggest a realistic deadline for this task based on its complexity and priority.
            
            Task Title: "${taskTitle}"
            Task Description: "${taskDescription}"
            Priority: ${priority}
            
            Consider:
            - Higher priority tasks need shorter deadlines
            - Complex tasks need more time
            - Account for review cycles and feedback
            - The deadline should be a future ISO date string
            
            Also rate the difficulty from 1-10.
            `,
        });

        return { success: true, data: output };
    } catch (error: any) {
        console.error("AI suggest deadline failed:", error);
        return { success: false, error: `Failed to suggest deadline. ${error?.message || ""}` };
    }
}

export async function generateDailyKeyPoints() {
    await requireAuth();

    try {
        await connectDB();

        // Get today's task activity
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeTasks = await Task.find({
            status: { $in: ["todo", "in_progress", "in_review"] },
        }).lean();

        const recentlyCompleted = await Task.find({
            status: "done",
            updatedAt: { $gte: today },
        }).lean();

        const urgentTasks = activeTasks.filter((t) => t.priority === "urgent" || t.priority === "high");

        const upcomingDeadlines = activeTasks
            .filter((t) => t.deadline)
            .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
            .slice(0, 5);

        const taskContext = `
        Active Tasks: ${activeTasks.length} (${urgentTasks.length} high/urgent priority)
        Completed Today: ${recentlyCompleted.length}
        
        Urgent/High Priority Tasks:
        ${urgentTasks.map((t) => `- "${t.title}" (${t.status}, priority: ${t.priority})`).join("\n") || "None"}
        
        Upcoming Deadlines:
        ${upcomingDeadlines.map((t) => `- "${t.title}" due ${new Date(t.deadline).toLocaleDateString()}`).join("\n") || "None"}
        
        Recently Completed:
        ${recentlyCompleted.map((t) => `- "${t.title}"`).join("\n") || "None"}
        `;

        const { output } = await generateText({
            model: google("gemini-2.5-flash"),
            output: Output.object({ schema: dailyKeyPointsSchema }),
            prompt: `
            ${SYSTEM_PROMPT}
            
            Generate daily key points and insights for the project manager based on today's task data.
            Focus on what needs immediate attention, what's progressing well, and any risks.
            
            ${taskContext}
            
            Provide 3-5 key points, prioritized by importance.
            `,
        });

        return { success: true, data: output };
    } catch (error: any) {
        console.error("AI daily key points failed:", error);
        return { success: false, error: `Failed to generate key points. ${error?.message || ""}` };
    }
}

export async function generateEODReport(date?: string) {
    await requireAdmin();

    try {
        await connectDB();

        const reportDate = date ? new Date(date) : new Date();
        reportDate.setHours(0, 0, 0, 0);
        const nextDay = new Date(reportDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const team = await getTeamContext();

        // Get all tasks that were updated today
        const todaysTasks = await Task.find({
            updatedAt: { $gte: reportDate, $lt: nextDay },
        }).lean();

        // Get completed tasks today
        const completedToday = todaysTasks.filter((t) => t.status === "done");
        const inProgress = await Task.find({ status: "in_progress" }).lean();

        const memberTaskMap = new Map<string, { completed: any[]; inProgress: any[] }>();

        for (const member of team) {
            memberTaskMap.set(member.id, { completed: [], inProgress: [] });
        }

        for (const task of completedToday) {
            for (const assigneeId of task.assigneeIds || []) {
                const id = assigneeId.toString();
                if (memberTaskMap.has(id)) {
                    memberTaskMap.get(id)!.completed.push(task);
                }
            }
        }

        for (const task of inProgress) {
            for (const assigneeId of task.assigneeIds || []) {
                const id = assigneeId.toString();
                if (memberTaskMap.has(id)) {
                    memberTaskMap.get(id)!.inProgress.push(task);
                }
            }
        }

        const memberContext = team.map((m) => {
            const data = memberTaskMap.get(m.id) || { completed: [], inProgress: [] };
            return `
            ${m.name} (${m.expertise}):
            - Completed: ${data.completed.map((t: any) => `"${t.title}"`).join(", ") || "None"}
            - In Progress: ${data.inProgress.map((t: any) => `"${t.title}"`).join(", ") || "None"}
            `;
        }).join("\n");

        const { output } = await generateText({
            model: google("gemini-2.5-flash"),
            output: Output.object({ schema: eodReportSchema }),
            prompt: `
            ${SYSTEM_PROMPT}
            
            Generate an end-of-day report for ${reportDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.
            
            Team Activity:
            ${memberContext}
            
            Total tasks completed today: ${completedToday.length}
            Total tasks in progress: ${inProgress.length}
            
            For each member, provide:
            - Number of tasks completed and in progress
            - Key highlights (what they accomplished)
            - Any blockers (infer from task status patterns)
            
            Use the exact member IDs from the data. Provide an overall progress assessment.
            `,
        });

        return {
            success: true,
            data: {
                ...output,
                date: reportDate.toISOString(),
            }
        };
    } catch (error: any) {
        console.error("AI EOD report failed:", error);
        return { success: false, error: `Failed to generate EOD report. ${error?.message || ""}` };
    }
}

// ─── Project Planning ───────────────────────────────────────

const smartProjectSchema = z.object({
    projectTitle: z.string().describe("A professional, concise title for the project"),
    description: z.string().describe("Executive summary of the project goals"),
    phases: z.array(z.object({
        name: z.string().describe("Phase name (e.g., Discovery, Design, Development)"),
        tasks: z.array(z.object({
            title: z.string(),
            description: z.string().describe("Actionable task description"),
            priority: z.enum(["low", "medium", "high", "urgent"]),
            estimatedHours: z.number().min(0.5).max(40),
            suggestedAssigneeName: z.string().optional().describe("Name of the best-fit team member from context"),
            role: z.string().describe("Role required (e.g., Designer, Developer)"),
            subtasks: z.array(z.object({
                title: z.string().describe("Specific step to complete the task"),
            })).optional().describe("3-5 actionable subtasks"),
        })),
    })).describe("Sequential phases of the project"),
    reasoning: z.string().describe("Why this structure was chosen"),
});

export async function generateProjectPlan(goal: string) {
    await requireAuth();

    try {
        const team = await getTeamContext();

        const teamContext = team.map((m) =>
            `- ${m.name} (${m.role}): Expertise in ${m.expertise}. Active tasks: ${m.activeTasks}`
        ).join("\n");

        const { output } = await generateText({
            model: google("gemini-2.5-flash"),
            output: Output.object({ schema: smartProjectSchema }),
            prompt: `
            ${SYSTEM_PROMPT}

            You are an expert Project Manager. Create a comprehensive project plan based on the user's goal.
            
            Goal: "${goal}"

            Team Context:
            ${teamContext}

            Instructions:
            1. Break the project into logical Phases (e.g., Strategy, Design, Dev, Launch).
            2. Populate each phase with specific, actionable Tasks.
            3. For each task, provide 3-5 specific SUBTASKS to make it actionable.
            4. Estimate hours realistically.
            5. Suggest the BEST team member for each task based on their expertise and load.
            6. Ensure the plan is complete (start to finish).
            `,
        });

        return { success: true, data: output };
    } catch (error: any) {
        console.error("AI project plan failed:", error);
        return { success: false, error: `Failed to generate project plan. ${error?.message || ""}` };
    }
}

