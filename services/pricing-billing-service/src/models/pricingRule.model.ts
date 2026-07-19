import mongoose, { Schema, Document } from "mongoose";

export interface IPricingRule extends Document {
  clientId: mongoose.Types.ObjectId;
  lotId: mongoose.Types.ObjectId;
  name: string;
  ratePerHour: number;
  currency: string;
  gracePeriodMinutes: number;
  maxDailyCharge?: number;
  isActive: boolean;
}

const PricingRuleSchema = new Schema<IPricingRule>(
  {
    clientId: { type: Schema.Types.ObjectId, required: true, index: true },
    lotId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, trim: true },
    ratePerHour: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    gracePeriodMinutes: { type: Number, default: 0, min: 0 },
    maxDailyCharge: { type: Number },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

PricingRuleSchema.index({ clientId: 1, lotId: 1 });

export const PricingRuleModel = mongoose.model<IPricingRule>("PricingRule", PricingRuleSchema);
