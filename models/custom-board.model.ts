import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomBoard extends Document {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    createdBy: mongoose.Types.ObjectId;
    taskIds: mongoose.Types.ObjectId[];
    isPinned: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CustomBoardSchema = new Schema<ICustomBoard>(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String },
        icon: { type: String, default: "Layout" },
        color: { type: String, default: "blue" },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        taskIds: [{
            type: Schema.Types.ObjectId,
            ref: "Task"
        }],
        isPinned: { type: Boolean, default: false },
    },
    { timestamps: true }
);

CustomBoardSchema.index({ createdBy: 1 });
CustomBoardSchema.index({ isPinned: -1, name: 1 });

export const CustomBoard: Model<ICustomBoard> =
    mongoose.models.CustomBoard ||
    mongoose.model<ICustomBoard>("CustomBoard", CustomBoardSchema);
