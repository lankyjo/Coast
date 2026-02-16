import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProject extends Document {
    name: string;
    description: string;
    status: "active" | "completed" | "on_hold" | "archived";
    deadline: Date;
    startDate: Date;
    progress: number;
    createdBy: mongoose.Types.ObjectId;
    tags: string[];
    shareToken?: string;
    attachments: {
        name: string;
        url: string;
        type: string;
        uploadedBy: mongoose.Types.ObjectId;
        uploadedAt: Date;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        status: {
            type: String,
            enum: ["active", "completed", "on_hold", "archived"],
            default: "active",
        },
        deadline: { type: Date, required: true },
        startDate: { type: Date, required: true },
        progress: { type: Number, default: 0, min: 0, max: 100 },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        tags: [{ type: String, trim: true }],
        shareToken: { type: String, unique: true, sparse: true },
        attachments: [
            {
                name: { type: String, required: true },
                url: { type: String, required: true },
                type: { type: String, required: true },
                uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
                uploadedAt: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

ProjectSchema.index({ status: 1 });
ProjectSchema.index({ deadline: 1 });
ProjectSchema.index({ createdBy: 1 });

export const Project: Model<IProject> =
    mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);
