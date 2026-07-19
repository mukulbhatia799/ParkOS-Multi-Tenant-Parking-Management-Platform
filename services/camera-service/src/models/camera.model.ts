import { Schema, model, Document, Types } from "mongoose";
import { CameraStatus, CameraType } from "@parking/shared";

export interface CameraDocument extends Document {
  clientId: Types.ObjectId;
  lotId: Types.ObjectId;
  name: string;
  cameraType: CameraType;
  status: CameraStatus;
  createdAt: Date;
  updatedAt: Date;
}

const cameraSchema = new Schema<CameraDocument>(
  {
    clientId: { type: Schema.Types.ObjectId, required: true },
    lotId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, trim: true },
    cameraType: { type: String, enum: Object.values(CameraType), required: true },
    status: { type: String, enum: Object.values(CameraStatus), default: CameraStatus.ACTIVE },
  },
  { timestamps: true }
);

cameraSchema.index({ clientId: 1, lotId: 1 });

export const CameraModel = model<CameraDocument>("Camera", cameraSchema);
