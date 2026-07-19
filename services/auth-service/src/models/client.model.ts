import { Schema, model, Document } from "mongoose";
import { ClientStatus, SubscriptionPlan } from "@parking/shared";

export interface ClientDocument extends Document {
  name: string;
  slug: string;
  contactEmail: string;
  contactPhone?: string;
  subscriptionPlan: SubscriptionPlan;
  status: ClientStatus;
  settings: {
    timezone: string;
    currency: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<ClientDocument>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String },
    subscriptionPlan: {
      type: String,
      enum: Object.values(SubscriptionPlan),
      default: SubscriptionPlan.TRIAL,
    },
    status: {
      type: String,
      enum: Object.values(ClientStatus),
      default: ClientStatus.ACTIVE,
    },
    settings: {
      timezone: { type: String, default: "UTC" },
      currency: { type: String, default: "USD" },
    },
  },
  { timestamps: true }
);

export const ClientModel = model<ClientDocument>("Client", clientSchema);
