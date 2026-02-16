import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITimeEntry extends Document {
    taskId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    startTime: Date;
    endTime?: Date;
    duration: number; // minutes
    note?: string;
    createdAt: Date;
}

const TimeEntrySchema = new Schema<ITimeEntry>(
    {
        taskId: {
            type: Schema.Types.ObjectId,
            ref: "Task",
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        startTime: { type: Date, required: true },
        endTime: { type: Date },
        duration: { type: Number, default: 0 },
        note: { type: String, trim: true },
    },
    { timestamps: true }
);

TimeEntrySchema.index({ taskId: 1 });
TimeEntrySchema.index({ userId: 1, startTime: -1 });

export const TimeEntry: Model<ITimeEntry> =
    mongoose.models.TimeEntry ||
    mongoose.model<ITimeEntry>("TimeEntry", TimeEntrySchema);
