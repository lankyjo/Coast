"use server";

import { requireAuth } from "./auth.actions";
import * as stickyNoteService from "@/services/sticky-note.service";
import * as notificationService from "@/services/notification.service";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import mongoose from "mongoose";

export async function createStickyNoteAction(data: {
    title: string;
    content: string;
    color?: any;
    category?: any;
    visibility?: "team" | "personal";
}) {
    try {
        const session = await requireAuth();
        const note = await stickyNoteService.createStickyNote({
            ...data,
            createdBy: session.user.id,
        });

        // If team visibility, notify everyone else
        if (data.visibility === "team") {
            await connectDB();
            const users = await mongoose.connection.collection("user").find(
                { _id: { $ne: new mongoose.Types.ObjectId(session.user.id) } },
                { projection: { _id: 1 } }
            ).toArray();

            const notificationPromises = users.map(u =>
                notificationService.createNotification({
                    userId: u._id.toString(),
                    type: "sticky_note_shared",
                    title: "New Team Note",
                    message: `${session.user.name} shared a new note: ${data.title}`,
                    metadata: {
                        triggeredBy: session.user.id
                    }
                })
            );
            await Promise.all(notificationPromises);
        }

        revalidatePath("/overview");
        return { success: true, data: note };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to create sticky note" };
    }
}

export async function getStickyNotesAction() {
    try {
        const session = await requireAuth();
        const notes = await stickyNoteService.getStickyNotes(session.user.id);
        return { success: true, data: notes };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to fetch sticky notes" };
    }
}

export async function updateStickyNoteAction(id: string, data: any) {
    try {
        await requireAuth();
        const note = await stickyNoteService.updateStickyNote(id, data);
        revalidatePath("/overview");
        return { success: true, data: note };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to update sticky note" };
    }
}

export async function deleteStickyNoteAction(id: string) {
    try {
        await requireAuth();
        await stickyNoteService.deleteStickyNote(id);
        revalidatePath("/overview");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to delete sticky note" };
    }
}

export async function togglePinStickyNoteAction(id: string) {
    try {
        await requireAuth();
        const note = await stickyNoteService.togglePinStickyNote(id);
        revalidatePath("/overview");
        return { success: true, data: note };
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to toggle pin" };
    }
}
