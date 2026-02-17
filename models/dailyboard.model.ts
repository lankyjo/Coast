import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDailyBoard extends Document {
    date: Date;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const DailyBoardSchema = new Schema<IDailyBoard>(
    {
        date: {
            type: Date,
            required: true,
            unique: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

DailyBoardSchema.index({ date: -1 });

export const DailyBoard: Model<IDailyBoard> =
    mongoose.models.DailyBoard ||
    mongoose.model<IDailyBoard>("DailyBoard", DailyBoardSchema);
