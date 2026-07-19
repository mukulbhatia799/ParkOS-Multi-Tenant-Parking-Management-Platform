import { Schema, model, Document, Types } from "mongoose";

export interface ParkingLotDocument extends Document {
  clientId: Types.ObjectId;
  name: string;
  address?: string;
  geo?: { lat: number; lng: number };
  totalCapacity: number;
  operatingHours?: { open: string; close: string };
  status: "active" | "inactive";
  defaultCurrency: string;
  createdAt: Date;
  updatedAt: Date;
}

const parkingLotSchema = new Schema<ParkingLotDocument>(
  {
    clientId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    address: { type: String },
    geo: {
      lat: { type: Number },
      lng: { type: Number },
    },
    totalCapacity: { type: Number, required: true, default: 0 },
    operatingHours: {
      open: { type: String },
      close: { type: String },
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    defaultCurrency: { type: String, default: "USD" },
  },
  { timestamps: true }
);

parkingLotSchema.index({ clientId: 1, _id: 1 });

export const ParkingLotModel = model<ParkingLotDocument>("ParkingLot", parkingLotSchema);
