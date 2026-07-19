import { Schema, model, Document, Types } from "mongoose";
import { CameraType, DetectionStatus } from "@parking/shared";

export interface DetectionLogDocument extends Document {
  clientId: Types.ObjectId;
  cameraId: Types.ObjectId;
  lotId: Types.ObjectId;
  cameraType: CameraType;
  licensePlate: string;
  confidence: number;
  capturedAt: Date;
  status: DetectionStatus;
  createdAt: Date;
}

const detectionLogSchema = new Schema<DetectionLogDocument>(
  {
    clientId: { type: Schema.Types.ObjectId, required: true },
    cameraId: { type: Schema.Types.ObjectId, required: true },
    lotId: { type: Schema.Types.ObjectId, required: true },
    cameraType: { type: String, enum: Object.values(CameraType), required: true },
    licensePlate: { type: String, required: true, uppercase: true, trim: true },
    confidence: { type: Number, required: true },
    capturedAt: { type: Date, required: true },
    status: { type: String, enum: Object.values(DetectionStatus), default: DetectionStatus.PUBLISHED },
  },
  { timestamps: true }
);

detectionLogSchema.index({ clientId: 1, cameraId: 1 });
detectionLogSchema.index({ clientId: 1, createdAt: 1 });

export const DetectionLogModel = model<DetectionLogDocument>("DetectionLog", detectionLogSchema);
