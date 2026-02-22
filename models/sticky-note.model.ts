import mongoose, { Schema, Document, Model } from "mongoose";

export type StickyNoteColor = "yellow" | "blue" | "green" | "pink" | "purple";
export type StickyNoteCategory = "recommendation" | "tip" | "reminder" | "goal" | "other";

export interface IStickyNote extends Document {
    title: string;
    content: string;
    color: StickyNoteColor;
    category: StickyNoteCategory;
    createdBy: mongoose.Types.ObjectId;
    visibility: "team" | "personal";
    isPinned: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const StickyNoteSchema = new Schema<IStickyNote>(
    {
        title: { type: String, required: true, trim: true },
        content: { type: String, required: true },
        color: {
            type: String,
            enum: ["yellow", "blue", "green", "pink", "purple"],
            default: "yellow",
        },
        category: {
            type: String,
            enum: ["recommendation", "tip", "reminder", "goal", "other"],
            default: "other",
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        visibility: {
            type: String,
            enum: ["team", "personal"],
            default: "personal",
        },
        isPinned: { type: Boolean, default: false },
    },
    { timestamps: true }
);

StickyNoteSchema.index({ visibility: 1, createdBy: 1 });
StickyNoteSchema.index({ isPinned: -1, createdAt: -1 });

export const StickyNote: Model<IStickyNote> =
    mongoose.models.StickyNote ||
    mongoose.model<IStickyNote>("StickyNote", StickyNoteSchema);
