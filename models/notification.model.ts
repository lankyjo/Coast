import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    type:
    | "task_assigned"
    | "task_completed"
    | "deadline_warning"
    | "eod_report"
    | "member_joined"
    | "info";
    title: string;
    message: string;
    read: boolean;
    metadata: {
        taskId?: mongoose.Types.ObjectId;
        projectId?: mongoose.Types.ObjectId;
        triggeredBy?: mongoose.Types.ObjectId;
    };
    createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: [
                "task_assigned",
                "task_completed",
                "deadline_warning",
                "eod_report",
                "member_joined",
                "sticky_note_shared",
                "info",
            ],
            required: true,
        },
        title: { type: String, required: true },
        message: { type: String, required: true },
        read: { type: Boolean, default: false },
        metadata: {
            taskId: { type: Schema.Types.ObjectId, ref: "Task" },
            projectId: { type: Schema.Types.ObjectId, ref: "Project" },
            triggeredBy: { type: Schema.Types.ObjectId, ref: "User" },
        },
    },
    { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification: Model<INotification> =
    mongoose.models.Notification ||
    mongoose.model<INotification>("Notification", NotificationSchema);
