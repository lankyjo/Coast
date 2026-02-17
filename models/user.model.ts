import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Lightweight Mongoose schema for the `user` collection managed by Better Auth.
 * This enables Mongoose .populate() calls to resolve user references
 * (e.g., in Comment, Activity models).
 *
 * Better Auth creates and manages this collection — this schema just
 * lets Mongoose read from it.
 */

export interface IUser extends Document {
    name: string;
    email: string;
    image?: string;
    role?: string;
    expertise?: string[];
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        image: { type: String },
        role: { type: String, default: "member" },
        expertise: [{ type: String }],
        emailVerified: { type: Boolean, default: false },
    },
    { timestamps: true, collection: "user" }
);

export const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
