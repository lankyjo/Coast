import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITimeLog extends Document {
    taskId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    projectId: mongoose.Types.ObjectId;
    startTime: Date;
    endTime?: Date;
    duration: number; // Duration in seconds
    description?: string;
    isManual: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const TimeLogSchema = new Schema<ITimeLog>(
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
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
        },
        duration: {
            type: Number,
            default: 0,
        },
        description: {
            type: String,
        },
        isManual: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Indexes for fast lookups
TimeLogSchema.index({ taskId: 1, userId: 1 });
TimeLogSchema.index({ userId: 1, startTime: -1 });

export const TimeLog: Model<ITimeLog> =
    mongoose.models.TimeLog ||
    mongoose.model<ITimeLog>("TimeLog", TimeLogSchema);
