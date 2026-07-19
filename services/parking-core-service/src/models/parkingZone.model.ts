import { Schema, model, Document, Types } from "mongoose";
import { ZoneType } from "@parking/shared";

export interface ZoneConnection {
  zoneId: Types.ObjectId;
  distance: number;
  edgeType: "walkway" | "ramp" | "elevator";
}

export interface ParkingZoneDocument extends Document {
  clientId: Types.ObjectId;
  lotId: Types.ObjectId;
  name: string;
  type: ZoneType;
  parentZoneId?: Types.ObjectId | null;
  graphNode?: { x: number; y: number; floor: number };
  connections: ZoneConnection[];
  createdAt: Date;
  updatedAt: Date;
}

const connectionSchema = new Schema<ZoneConnection>(
  {
    zoneId: { type: Schema.Types.ObjectId, ref: "ParkingZone", required: true },
    distance: { type: Number, required: true, default: 1 },
    edgeType: { type: String, enum: ["walkway", "ramp", "elevator"], default: "walkway" },
  },
  { _id: false }
);

const parkingZoneSchema = new Schema<ParkingZoneDocument>(
  {
    clientId: { type: Schema.Types.ObjectId, required: true },
    lotId: { type: Schema.Types.ObjectId, required: true, ref: "ParkingLot" },
    name: { type: String, required: true },
    type: { type: String, enum: Object.values(ZoneType), required: true },
    parentZoneId: { type: Schema.Types.ObjectId, ref: "ParkingZone", default: null },
    graphNode: {
      x: { type: Number },
      y: { type: Number },
      floor: { type: Number },
    },
    connections: { type: [connectionSchema], default: [] },
  },
  { timestamps: true }
);

parkingZoneSchema.index({ clientId: 1, lotId: 1 });
parkingZoneSchema.index({ clientId: 1, lotId: 1, type: 1 });

export const ParkingZoneModel = model<ParkingZoneDocument>("ParkingZone", parkingZoneSchema);
