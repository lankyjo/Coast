import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICrmActivity extends Document {
    prospect_id: mongoose.Types.ObjectId;
    performed_by: mongoose.Types.ObjectId;
    activity_type:
    | "email_sent"
    | "call_made"
    | "call_received"
    | "email_received"
    | "note_added"
    | "meeting"
    | "follow_up_sent"
    | "auto_follow_up"
    | "auto_thank_you"
    | "stage_changed"
    | "other";
    subject: string;
    details?: string;
    template_id?: mongoose.Types.ObjectId;
    outcome?:
    | "positive"
    | "neutral"
    | "negative"
    | "no_response"
    | "voicemail"
    | "scheduled_follow_up";
    follow_up_date?: Date;
    is_automated: boolean;
    createdAt: Date;
}

const CrmActivitySchema = new Schema<ICrmActivity>(
    {
        prospect_id: {
            type: Schema.Types.ObjectId,
            ref: "Prospect",
            required: true,
        },
        performed_by: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        activity_type: {
            type: String,
            enum: [
                "email_sent",
                "call_made",
                "call_received",
                "email_received",
                "note_added",
                "meeting",
                "follow_up_sent",
                "auto_follow_up",
                "auto_thank_you",
                "stage_changed",
                "other",
            ],
            required: true,
        },
        subject: { type: String, required: true },
        details: { type: String },
        template_id: {
            type: Schema.Types.ObjectId,
            ref: "CrmTemplate",
        },
        outcome: {
            type: String,
            enum: [
                "positive",
                "neutral",
                "negative",
                "no_response",
                "voicemail",
                "scheduled_follow_up",
            ],
        },
        follow_up_date: { type: Date },
        is_automated: { type: Boolean, default: false },
    },
    { timestamps: true }
);

CrmActivitySchema.index({ prospect_id: 1, createdAt: -1 });
CrmActivitySchema.index({ performed_by: 1, createdAt: -1 });

export const CrmActivity: Model<ICrmActivity> =
    mongoose.models.CrmActivity ||
    mongoose.model<ICrmActivity>("CrmActivity", CrmActivitySchema);
