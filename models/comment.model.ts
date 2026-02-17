import mongoose, { Schema, Document, Model } from "mongoose";

export interface IComment extends Document {
    taskId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    text: string;
    taggedUserIds: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
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
        text: {
            type: String,
            required: true,
            trim: true,
        },
        taggedUserIds: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    { timestamps: true }
);

CommentSchema.index({ taskId: 1, createdAt: -1 });

export const Comment: Model<IComment> =
    mongoose.models.Comment ||
    mongoose.model<IComment>("Comment", CommentSchema);
