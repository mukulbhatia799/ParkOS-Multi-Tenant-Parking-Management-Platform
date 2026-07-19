import { Schema, model, Document, Types } from "mongoose";
import { ParkingRecordStatus, VehicleType } from "@parking/shared";

export interface ParkingRecordDocument extends Document {
  clientId: Types.ObjectId;
  lotId: Types.ObjectId;
  zoneId: Types.ObjectId;
  slotId: Types.ObjectId;
  slotNumber: string;
  vehicleId: Types.ObjectId;
  licensePlate: string;
  vehicleType: VehicleType;
  status: ParkingRecordStatus;
  entryTime: Date;
  exitTime?: Date | null;
  durationMinutes?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const parkingRecordSchema = new Schema<ParkingRecordDocument>(
  {
    clientId: { type: Schema.Types.ObjectId, required: true },
    lotId: { type: Schema.Types.ObjectId, required: true },
    zoneId: { type: Schema.Types.ObjectId, required: true },
    slotId: { type: Schema.Types.ObjectId, required: true },
    slotNumber: { type: String, required: true },
    vehicleId: { type: Schema.Types.ObjectId, required: true, ref: "Vehicle" },
    licensePlate: { type: String, required: true, uppercase: true, trim: true },
    vehicleType: { type: String, enum: Object.values(VehicleType), default: VehicleType.CAR },
    status: { type: String, enum: Object.values(ParkingRecordStatus), default: ParkingRecordStatus.ACTIVE },
    entryTime: { type: Date, required: true },
    exitTime: { type: Date, default: null },
    durationMinutes: { type: Number, default: null },
  },
  { timestamps: true }
);

parkingRecordSchema.index({ clientId: 1, status: 1 });
parkingRecordSchema.index({ clientId: 1, slotId: 1 });
parkingRecordSchema.index({ clientId: 1, vehicleId: 1 });

export const ParkingRecordModel = model<ParkingRecordDocument>("ParkingRecord", parkingRecordSchema);
