import mongoose, { Schema, Document, Model } from "mongoose";

export type ActivityAction =
    | "task_created"
    | "task_completed"
    | "task_assigned"
    | "file_uploaded"
    | "project_created"
    | "comment_added"
    | "deadline_updated"
    | "status_changed"
    | "member_invited"
    | "time_logged";

export interface IActivity extends Document {
    projectId?: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    action: ActivityAction;
    description: string;
    metadata: {
        taskId?: mongoose.Types.ObjectId;
        previousValue?: string;
        newValue?: string;
    };
    createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
    {
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        action: {
            type: String,
            enum: [
                "task_created",
                "task_completed",
                "task_assigned",
                "file_uploaded",
                "project_created",
                "comment_added",
                "deadline_updated",
                "status_changed",
                "member_invited",
                "time_logged",
            ],
            required: true,
        },
        description: { type: String, required: true },
        metadata: {
            taskId: { type: Schema.Types.ObjectId, ref: "Task" },
            previousValue: { type: String },
            newValue: { type: String },
        },
    },
    { timestamps: true }
);

ActivitySchema.index({ projectId: 1, createdAt: -1 });
ActivitySchema.index({ userId: 1, createdAt: -1 });

export const Activity: Model<IActivity> =
    mongoose.models.Activity ||
    mongoose.model<IActivity>("Activity", ActivitySchema);
