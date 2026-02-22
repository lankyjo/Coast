"use server";

import { connectDB } from "@/lib/db";
import { StickyNote, IStickyNote } from "@/models/sticky-note.model";
import mongoose from "mongoose";

export async function createStickyNote(data: {
    title: string;
    content: string;
    color?: string;
    category?: string;
    visibility?: "team" | "personal";
    createdBy: string;
}): Promise<IStickyNote> {
    await connectDB();
    const note = await StickyNote.create(data);
    return JSON.parse(JSON.stringify(note));
}

export async function getStickyNotes(userId: string): Promise<IStickyNote[]> {
    await connectDB();
    const notes = await StickyNote.find({
        $or: [
            { visibility: "team" },
            { visibility: "personal", createdBy: userId },
        ],
    })
        .sort({ isPinned: -1, createdAt: -1 })
        .lean();
    return JSON.parse(JSON.stringify(notes));
}

export async function updateStickyNote(
    id: string,
    data: Partial<IStickyNote>
): Promise<IStickyNote | null> {
    await connectDB();
    const note = await StickyNote.findByIdAndUpdate(
        id,
        { $set: data },
        { returnDocument: "after", runValidators: true }
    ).lean();
    if (!note) return null;
    return JSON.parse(JSON.stringify(note));
}

export async function deleteStickyNote(id: string): Promise<boolean> {
    await connectDB();
    const result = await StickyNote.findByIdAndDelete(id);
    return !!result;
}

export async function togglePinStickyNote(id: string): Promise<IStickyNote | null> {
    await connectDB();
    const note = await StickyNote.findById(id);
    if (!note) return null;
    note.isPinned = !note.isPinned;
    await note.save();
    return JSON.parse(JSON.stringify(note));
}
