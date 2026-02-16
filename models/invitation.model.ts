import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInvitation extends Document {
    email: string;
    role: "admin" | "member";
    token: string;
    invitedBy: mongoose.Types.ObjectId;
    status: "pending" | "accepted" | "expired";
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
    {
        email: { type: String, required: true, trim: true, lowercase: true },
        role: { type: String, enum: ["admin", "member"], default: "member" },
        token: { type: String, required: true, unique: true },
        invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        status: {
            type: String,
            enum: ["pending", "accepted", "expired"],
            default: "pending",
        },
        expiresAt: { type: Date, required: true },
    },
    { timestamps: true }
);

// Index for finding pending invites by email (to prevent duplicates)
InvitationSchema.index({ email: 1, status: 1 });
InvitationSchema.index({ token: 1 });

export const Invitation: Model<IInvitation> =
    mongoose.models.Invitation || mongoose.model<IInvitation>("Invitation", InvitationSchema);
