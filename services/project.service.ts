import { connectDB } from "@/lib/db";
import { Project, IProject } from "@/models/project.model";
import {
    CreateProjectInput,
    UpdateProjectInput,
    ProjectStatus,
} from "@/types/project.types";
import mongoose, { SortOrder } from "mongoose";

export async function createProject(
    data: CreateProjectInput,
    userId: string
): Promise<IProject> {
    await connectDB();

    const newProject = await Project.create({
        ...data,
        createdBy: userId,
        startDate: new Date(data.startDate),
        deadline: new Date(data.deadline),
        status: "active",
        progress: 0,
        tags: data.tags || [],
    });

    return JSON.parse(JSON.stringify(newProject));
}

export async function getProjects(filters?: {
    status?: ProjectStatus;
    search?: string;
    sortBy?: string;
    sortOrder?: SortOrder;
}): Promise<IProject[]> {
    await connectDB();

    const query: any = {};

    if (filters?.status) {
        query.status = filters.status;
    }

    if (filters?.search) {
        query.$or = [
            { name: { $regex: filters.search, $options: "i" } },
            { description: { $regex: filters.search, $options: "i" } },
        ];
    }

    const sort: Record<string, SortOrder> = {};
    if (filters?.sortBy) {
        sort[filters.sortBy] = filters.sortOrder || "desc";
    } else {
        sort.createdAt = "desc";
    }

    const projects = await Project.find(query).sort(sort).lean();

    return JSON.parse(JSON.stringify(projects));
}

export async function getProjectById(
    id: string
): Promise<IProject | null> {
    await connectDB();

    try {
        const project = await Project.findById(id).lean();
        if (!project) return null;
        return JSON.parse(JSON.stringify(project));
    } catch {
        return null;
    }
}

export async function updateProject(
    id: string,
    data: UpdateProjectInput
): Promise<IProject | null> {
    await connectDB();

    const project = await Project.findByIdAndUpdate(
        id,
        { $set: data },
        { returnDocument: "after", runValidators: true }
    ).lean();

    if (!project) return null;
    return JSON.parse(JSON.stringify(project));
}

export async function deleteProject(id: string): Promise<boolean> {
    await connectDB();
    const result = await Project.findByIdAndDelete(id);
    return !!result;
}
