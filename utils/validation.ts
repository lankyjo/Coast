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
        .min(1, "Due date is required")
        .refine((val) => !isNaN(Date.parse(val)), {
            message: "Invalid date format",
        }),
    startDate: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
            message: "Invalid date format",
        }),
    dailyBoardId: z.string().optional(),
    visibility: z.enum(["general", "private"]).optional(),
    subtasks: z.array(z.object({
        title: z.string().min(1, "Subtask title is required"),
        done: z.boolean().optional().default(false),
    })).optional(),
});

export const updateTaskSchema = z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    projectId: z.string().optional(),
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
    startDate: z
        .string()
        .optional()
        .refine((val) => !val || !isNaN(Date.parse(val)), {
            message: "Invalid date format",
        }),
    visibility: z.enum(["general", "private"]).optional(),
});

// Prospects
export const createProspectSchema = z.object({
    business_name: z.string().min(2, "Business name must be at least 2 characters"),
    owner_name: z.string().optional(),
    email: z
        .string()
        .optional()
        .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
            message: "Invalid email address",
        }),
    phone: z.string().optional(),
    website: z.string().optional(),
    address: z.string().optional(),
    market: z.enum(["DFW", "North Alabama", "Other"]),
    category: z.enum(["Roofing", "Builders", "Landscaping", "Pools", "Real Estate", "Property Mgmt", "Auto Detail", "Cleaning", "Custom"]),
    rating_score: z.number().min(1).max(5),
    rating_notes: z.string().optional(),
    google_rating: z.number().min(0).max(5).optional(),
    review_count: z.number().int().min(0).optional(),
    social_facebook: z.string().optional(),
    social_instagram: z.string().optional(),
    social_linkedin: z.string().optional(),
    est_revenue: z.string().optional(),
    est_employees: z.string().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateProspectInput = z.infer<typeof createProspectSchema>;
