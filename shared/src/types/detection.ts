import { CameraType, DetectionStatus } from "./enums";

export interface DetectionLog {
  _id: string;
  clientId: string;
  cameraId: string;
  lotId: string;
  cameraType: CameraType;
  licensePlate: string;
  confidence: number;
  capturedAt: string;
  status: DetectionStatus;
  createdAt: string;
}
