import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPipelineHistory extends Document {
    prospect_id: mongoose.Types.ObjectId;
    from_stage: string;
    to_stage: string;
    changed_by: mongoose.Types.ObjectId;
    notes?: string;
    createdAt: Date;
}

const PipelineHistorySchema = new Schema<IPipelineHistory>(
    {
        prospect_id: {
            type: Schema.Types.ObjectId,
            ref: "Prospect",
            required: true,
        },
        from_stage: {
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
            required: true,
        },
        to_stage: {
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
            required: true,
        },
        changed_by: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        notes: { type: String },
    },
    { timestamps: true }
);

PipelineHistorySchema.index({ prospect_id: 1, createdAt: -1 });

export const PipelineHistory: Model<IPipelineHistory> =
    mongoose.models.PipelineHistory ||
    mongoose.model<IPipelineHistory>("PipelineHistory", PipelineHistorySchema);
