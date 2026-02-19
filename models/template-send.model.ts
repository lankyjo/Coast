import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITemplateSend extends Document {
    template_id: mongoose.Types.ObjectId;
    prospect_id: mongoose.Types.ObjectId;
    sent_by: mongoose.Types.ObjectId;
    sent_at: Date;
    is_automated: boolean;
    status: "sent" | "opened" | "replied" | "bounced";
    replied_at?: Date;
    reply_sentiment?: "positive" | "neutral" | "negative" | "not_applicable";
    notes?: string;
}

const TemplateSendSchema = new Schema<ITemplateSend>(
    {
        template_id: {
            type: Schema.Types.ObjectId,
            ref: "CrmTemplate",
            required: true,
        },
        prospect_id: {
            type: Schema.Types.ObjectId,
            ref: "Prospect",
            required: true,
        },
        sent_by: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        sent_at: { type: Date, default: Date.now },
        is_automated: { type: Boolean, default: false },
        status: {
            type: String,
            enum: ["sent", "opened", "replied", "bounced"],
            default: "sent",
        },
        replied_at: { type: Date },
        reply_sentiment: {
            type: String,
            enum: ["positive", "neutral", "negative", "not_applicable"],
        },
        notes: { type: String },
    },
    { timestamps: true }
);

TemplateSendSchema.index({ template_id: 1, sent_at: -1 });
TemplateSendSchema.index({ prospect_id: 1, sent_at: -1 });
TemplateSendSchema.index({ sent_by: 1, sent_at: -1 });

export const TemplateSend: Model<ITemplateSend> =
    mongoose.models.TemplateSend ||
    mongoose.model<ITemplateSend>("TemplateSend", TemplateSendSchema);
