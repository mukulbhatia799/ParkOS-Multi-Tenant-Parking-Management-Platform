import { Schema, model, Document, Types } from "mongoose";
import { SlotStatus, SlotType } from "@parking/shared";

export interface ParkingSlotDocument extends Document {
  clientId: Types.ObjectId;
  lotId: Types.ObjectId;
  zoneId: Types.ObjectId;
  slotNumber: string;
  type: SlotType;
  status: SlotStatus;
  currentRecordId?: Types.ObjectId | null;
  position?: { x: number; y: number };
  createdAt: Date;
  updatedAt: Date;
}

const parkingSlotSchema = new Schema<ParkingSlotDocument>(
  {
    clientId: { type: Schema.Types.ObjectId, required: true },
    lotId: { type: Schema.Types.ObjectId, required: true, ref: "ParkingLot" },
    zoneId: { type: Schema.Types.ObjectId, required: true, ref: "ParkingZone" },
    slotNumber: { type: String, required: true },
    type: { type: String, enum: Object.values(SlotType), default: SlotType.REGULAR },
    status: { type: String, enum: Object.values(SlotStatus), default: SlotStatus.AVAILABLE },
    currentRecordId: { type: Schema.Types.ObjectId, default: null },
    position: {
      x: { type: Number },
      y: { type: Number },
    },
  },
  { timestamps: true }
);

parkingSlotSchema.index({ clientId: 1, lotId: 1, status: 1 });
parkingSlotSchema.index({ clientId: 1, lotId: 1, slotNumber: 1 }, { unique: true });

export const ParkingSlotModel = model<ParkingSlotDocument>("ParkingSlot", parkingSlotSchema);
