import { z } from "zod";
import { TASK_STATUS } from "@/constants/task-status";
import { PRIORITY } from "@/constants/priority";
import { EXPERTISE_OPTIONS } from "@/constants/expertise";

// Auth
export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

export const inviteMemberSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    expertise: z.enum([...EXPERTISE_OPTIONS], {
        message: "Please select a valid expertise",
    }),
});

// Projects
export const createProjectSchema = z.object({
    name: z.string().min(2, "Project name must be at least 2 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    deadline: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    }),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    }),
    tags: z.array(z.string()).optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

// Tasks
export const createTaskSchema = z.object({
    title: z.string().min(2, "Task title must be at least 2 characters"),
    description: z
        .string()
        .min(5, "Description must be at least 5 characters"),
    projectId: z.string().min(1, "Project is required"),
    assigneeIds: z.array(z.string()).optional(),
    priority: z.enum(
        Object.values(PRIORITY) as [string, ...string[]]
    ),
    deadline: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
            message: "Invalid date format",
        }),
});

export const updateTaskSchema = z.object({
    title: z.string().min(2).optional(),
    description: z.string().min(5).optional(),
    assigneeIds: z.array(z.string()).optional(),
    status: z
        .enum(Object.values(TASK_STATUS) as [string, ...string[]])
        .optional(),
    priority: z
        .enum(Object.values(PRIORITY) as [string, ...string[]])
        .optional(),
    deadline: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
            message: "Invalid date format",
        }),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
