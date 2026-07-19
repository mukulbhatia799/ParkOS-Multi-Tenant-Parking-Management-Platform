import mongoose, { Schema, Document } from "mongoose";

export interface IBillingRecord extends Document {
  clientId: mongoose.Types.ObjectId;
  parkingRecordId: mongoose.Types.ObjectId;
  lotId: mongoose.Types.ObjectId;
  licensePlate: string;
  durationMinutes: number;
  amountDue: number;
  currency: string;
  pricingRuleId?: mongoose.Types.ObjectId;
  calculatedAt: Date;
}

const BillingRecordSchema = new Schema<IBillingRecord>(
  {
    clientId: { type: Schema.Types.ObjectId, required: true, index: true },
    parkingRecordId: { type: Schema.Types.ObjectId, required: true, unique: true },
    lotId: { type: Schema.Types.ObjectId, required: true },
    licensePlate: { type: String, required: true },
    durationMinutes: { type: Number, required: true },
    amountDue: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    pricingRuleId: { type: Schema.Types.ObjectId },
    calculatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

BillingRecordSchema.index({ clientId: 1, lotId: 1 });
BillingRecordSchema.index({ clientId: 1, createdAt: -1 });

export const BillingRecordModel = mongoose.model<IBillingRecord>("BillingRecord", BillingRecordSchema);
