"use server";

import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { requireAuth } from "./auth.actions";

const taskSchema = z.object({
    title: z.string().describe("Clear, concise title for the task"),
    description: z.string().describe("Detailed description of what needs to be done"),
    priority: z.enum(["low", "medium", "high", "urgent"]).describe("Priority level based on urgency and impact"),
    subtasks: z.array(z.string()).describe("List of subtasks to complete the main task"),
    estimatedHours: z.number().optional().describe("Estimated hours to complete the task"),
    deadline: z.string().optional().describe("ISO date string for the deadline, if mentioned"),
});

export async function generateTaskFromInput(input: string) {
    await requireAuth();

    try {
        const { output: taskData } = await generateText({
            model: google("gemini-2.5-flash"),
            output: Output.object({ schema: taskSchema }),
            prompt: `
            You are a project management AI assistant.
            Analyze the following request and generate a structured task.
            Identify subtasks if the request implies multiple steps.
            Infer priority based on words like "asap", "urgent", "whenever".
            
            Request: "${input}"
            `,
        });

        return { success: true, data: taskData };
    } catch (error) {
        console.error("AI generation failed:", error);
        // @ts-ignore
        const errorMessage = error?.message || "Unknown error";
        return { error: `Failed to generate task. Error: ${errorMessage}` };
    }
}
