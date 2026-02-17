"use server";

import { createProjectSchema, updateProjectSchema } from "@/utils/validation";
import { requireAuth, requireAdmin } from "./auth.actions";
import * as projectService from "@/services/project.service";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity.actions";

export async function createProject(formData: unknown) {
    const session = await requireAdmin();

    const result = createProjectSchema.safeParse(formData);

    if (!result.success) {
        return {
            error: "Validation failed",
            details: result.error.flatten().fieldErrors,
        };
    }

    try {
        const project = await projectService.createProject(
            result.data,
            session.user.id
        );
        revalidatePath("/dashboard");
        revalidatePath("/projects");

        // Log activity
        await logActivity(
            session.user.id,
            project._id.toString(),
            "project_created",
            `created project "${project.name}"`
        );

        return { success: true, data: project };
    } catch (error) {
        console.error("Failed to create project:", error);
        return { error: "Failed to create project" };
    }
}

export async function getProjects(filters?: {
    status?: any;
    search?: string;
    sortBy?: string;
    sortOrder?: any;
}) {
    await requireAuth();
    try {
        const projects = await projectService.getProjects(filters);
        return { success: true, data: projects };
    } catch (error) {
        console.error("Failed to fetch projects:", error);
        return { error: "Failed to fetch projects" };
    }
}

export async function getProjectById(id: string) {
    await requireAuth();
    try {
        const project = await projectService.getProjectById(id);
        if (!project) return { error: "Project not found" };
        return { success: true, data: project };
    } catch (error) {
        console.error("Failed to fetch project:", error);
        return { error: "Failed to fetch project" };
    }
}

export async function updateProject(id: string, formData: unknown) {
    await requireAdmin();

    const result = updateProjectSchema.safeParse(formData);

    if (!result.success) {
        return {
            error: "Validation failed",
            details: result.error.flatten().fieldErrors,
        };
    }

    try {
        const project = await projectService.updateProject(id, result.data);
        if (!project) return { error: "Project not found" };
        revalidatePath(`/projects/${id}`);
        revalidatePath("/projects");
        return { success: true, data: project };
    } catch (error) {
        console.error("Failed to update project:", error);
        return { error: "Failed to update project" };
    }
}

export async function deleteProject(id: string) {
    await requireAdmin();
    try {
        const success = await projectService.deleteProject(id);
        if (!success) return { error: "Project not found or could not be deleted" };
        revalidatePath("/projects");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete project:", error);
        return { error: "Failed to delete project" };
    }
}
