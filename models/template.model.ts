import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICrmTemplate extends Document {
    name: string;
    subject_line: string;
    body: string;
    category:
    | "Cold Intro"
    | "Follow-Up"
    | "Value Add"
    | "Case Study"
    | "Re-Engagement"
    | "Thank You"
    | "Welcome"
    | "Kickoff"
    | "Custom";
    target_industry?: string;
    is_auto_template: boolean;
    auto_trigger?: string;
    tags: string[];
    created_by: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const CrmTemplateSchema = new Schema<ICrmTemplate>(
    {
        name: { type: String, required: true, trim: true },
        subject_line: { type: String, required: true },
        body: { type: String, required: true },
        category: {
            type: String,
            enum: [
                "Cold Intro",
                "Follow-Up",
                "Value Add",
                "Case Study",
                "Re-Engagement",
                "Thank You",
                "Welcome",
                "Kickoff",
                "Custom",
            ],
            default: "Custom",
        },
        target_industry: { type: String },
        is_auto_template: { type: Boolean, default: false },
        auto_trigger: { type: String },
        tags: [{ type: String, trim: true }],
        created_by: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

CrmTemplateSchema.index({ category: 1 });
CrmTemplateSchema.index({ is_auto_template: 1 });

export const CrmTemplate: Model<ICrmTemplate> =
    mongoose.models.CrmTemplate ||
    mongoose.model<ICrmTemplate>("CrmTemplate", CrmTemplateSchema);
