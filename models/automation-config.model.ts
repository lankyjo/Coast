import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAutomationConfig extends Document {
    trigger_name: string;
    enabled: boolean;
    template_id?: mongoose.Types.ObjectId;
    delay_days?: number;
    target_category?: string;
    createdAt: Date;
}

const AutomationConfigSchema = new Schema<IAutomationConfig>(
    {
        trigger_name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        enabled: { type: Boolean, default: true },
        template_id: {
            type: Schema.Types.ObjectId,
            ref: "CrmTemplate",
        },
        delay_days: { type: Number },
        target_category: { type: String },
    },
    { timestamps: true }
);

export const AutomationConfig: Model<IAutomationConfig> =
    mongoose.models.AutomationConfig ||
    mongoose.model<IAutomationConfig>("AutomationConfig", AutomationConfigSchema);
