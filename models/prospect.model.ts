import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProspect extends Document {
    business_name: string;
    owner_name?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    market: string;
    category: string;
    weakness_score: number;
    weakness_notes?: string;
    google_rating?: number;
    review_count?: number;
    social_facebook?: string;
    social_instagram?: string;
    social_linkedin?: string;
    est_revenue?: string;
    est_employees?: string;
    lead_source: "Manual" | "CSV Import" | "Referral" | "Website";
    referral_source?: string;
    pipeline_stage:
    | "new_lead"
    | "contacted"
    | "follow_up"
    | "responded"
    | "discovery"
    | "proposal_sent"
    | "negotiation"
    | "won"
    | "project_started"
    | "lost"
    | "nurture";
    contacted: boolean;
    contacted_at?: Date;
    responded: boolean;
    responded_at?: Date;
    deal_closed: boolean;
    deal_closed_at?: Date;
    project_started: boolean;
    project_started_at?: Date;
    inputted_by: mongoose.Types.ObjectId;
    assigned_to: mongoose.Types.ObjectId;
    tags: string[];
    notes?: string;
    loss_reason?: "budget" | "timing" | "competitor" | "no_response" | "not_interested";
    nurture_date?: Date;
    follow_up_paused: boolean;
    last_auto_email_at?: Date;
    follow_up_step: number;
    createdAt: Date;
    updatedAt: Date;
}

const ProspectSchema = new Schema<IProspect>(
    {
        business_name: { type: String, required: true, trim: true },
        owner_name: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
        phone: { type: String, trim: true },
        website: { type: String, trim: true },
        address: { type: String, trim: true },
        market: {
            type: String,
            trim: true,
            default: "Other",
        },
        category: {
            type: String,
            trim: true,
            default: "Custom",
        },
        weakness_score: { type: Number, min: 1, max: 5, default: 3 },
        weakness_notes: { type: String },
        google_rating: { type: Number, min: 0, max: 5 },
        review_count: { type: Number, min: 0 },
        social_facebook: { type: String },
        social_instagram: { type: String },
        social_linkedin: { type: String },
        est_revenue: { type: String },
        est_employees: { type: String },
        lead_source: {
            type: String,
            enum: ["Manual", "CSV Import", "Referral", "Website"],
            default: "Manual",
        },
        referral_source: { type: String },
        pipeline_stage: {
            type: String,
            enum: [
                "new_lead",
                "contacted",
                "follow_up",
                "responded",
                "discovery",
                "proposal_sent",
                "negotiation",
                "won",
                "project_started",
                "lost",
                "nurture",
            ],
            default: "new_lead",
        },
        contacted: { type: Boolean, default: false },
        contacted_at: { type: Date },
        responded: { type: Boolean, default: false },
        responded_at: { type: Date },
        deal_closed: { type: Boolean, default: false },
        deal_closed_at: { type: Date },
        project_started: { type: Boolean, default: false },
        project_started_at: { type: Date },
        inputted_by: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        assigned_to: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        tags: [{ type: String, trim: true }],
        notes: { type: String },
        loss_reason: {
            type: String,
            enum: ["budget", "timing", "competitor", "no_response", "not_interested"],
        },
        nurture_date: { type: Date },
        follow_up_paused: { type: Boolean, default: false },
        last_auto_email_at: { type: Date },
        follow_up_step: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Targeted indexes — minimal to stay storage-conscious
ProspectSchema.index({ pipeline_stage: 1 });
ProspectSchema.index({ market: 1, category: 1 });
ProspectSchema.index({ weakness_score: -1 });
ProspectSchema.index({ assigned_to: 1 });
ProspectSchema.index({ business_name: 1, market: 1 }, { unique: true });
// Text index for full-text search
ProspectSchema.index(
    { business_name: "text", owner_name: "text", notes: "text" },
    { name: "prospect_text_search" }
);

export const Prospect: Model<IProspect> =
    mongoose.models.Prospect || mongoose.model<IProspect>("Prospect", ProspectSchema);
