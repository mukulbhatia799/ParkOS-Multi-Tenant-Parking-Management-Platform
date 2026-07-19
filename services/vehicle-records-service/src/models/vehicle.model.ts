import { Schema, model, Document, Types } from "mongoose";
import { VehicleType } from "@parking/shared";

export interface VehicleDocument extends Document {
  clientId: Types.ObjectId;
  licensePlate: string;
  type: VehicleType;
  ownerName?: string;
  ownerContact?: string;
  createdAt: Date;
  updatedAt: Date;
}

const vehicleSchema = new Schema<VehicleDocument>(
  {
    clientId: { type: Schema.Types.ObjectId, required: true },
    licensePlate: { type: String, required: true, uppercase: true, trim: true },
    type: { type: String, enum: Object.values(VehicleType), default: VehicleType.CAR },
    ownerName: { type: String },
    ownerContact: { type: String },
  },
  { timestamps: true }
);

vehicleSchema.index({ clientId: 1, licensePlate: 1 }, { unique: true });

export const VehicleModel = model<VehicleDocument>("Vehicle", vehicleSchema);
