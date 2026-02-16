import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubtask {
    _id: mongoose.Types.ObjectId;
    title: string;
    done: boolean;
    completedAt?: Date;
}

export interface ITimeEntry {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    startTime: Date;
    endTime?: Date;
    duration: number;
    note?: string;
}

export interface IAIMetadata {
    suggestedAssignee?: mongoose.Types.ObjectId;
    suggestedDeadline?: Date;
    difficultyScore?: number;
    reasoning?: string;
}

export interface ITask extends Document {
    title: string;
    description: string;
    projectId: mongoose.Types.ObjectId;
    assigneeId: mongoose.Types.ObjectId;
    assignedBy: mongoose.Types.ObjectId;
    status: "todo" | "in_progress" | "in_review" | "done";
    priority: "low" | "medium" | "high" | "urgent";
    deadline: Date;
    estimatedHours?: number;
    subtasks: ISubtask[];
    attachments: {
        name: string;
        url: string;
        type: string;
        uploadedBy: mongoose.Types.ObjectId;
        uploadedAt: Date;
    }[];
    aiMetadata: IAIMetadata;
    timeEntries: ITimeEntry[];
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const SubtaskSchema = new Schema<ISubtask>({
    title: { type: String, required: true },
    done: { type: Boolean, default: false },
    completedAt: { type: Date },
});

const TimeEntrySchema = new Schema<ITimeEntry>({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: { type: Number, default: 0 },
    note: { type: String },
});

const TaskSchema = new Schema<ITask>(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        assigneeId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        assignedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["todo", "in_progress", "in_review", "done"],
            default: "todo",
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium",
        },
        deadline: { type: Date },
        estimatedHours: { type: Number },
        subtasks: [SubtaskSchema],
        attachments: [
            {
                name: { type: String, required: true },
                url: { type: String, required: true },
                type: { type: String, required: true },
                uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
                uploadedAt: { type: Date, default: Date.now },
            },
        ],
        aiMetadata: {
            suggestedAssignee: { type: Schema.Types.ObjectId, ref: "User" },
            suggestedDeadline: { type: Date },
            difficultyScore: { type: Number, min: 1, max: 10 },
            reasoning: { type: String },
        },
        timeEntries: [TimeEntrySchema],
        completedAt: { type: Date },
    },
    { timestamps: true }
);

TaskSchema.index({ projectId: 1, status: 1 });
TaskSchema.index({ assigneeId: 1, status: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ deadline: 1 });

export const Task: Model<ITask> =
    mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);
