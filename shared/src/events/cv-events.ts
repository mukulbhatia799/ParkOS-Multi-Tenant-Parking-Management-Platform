import { CameraType } from "../types/enums";

export interface CvPlateDetectedPayload {
  detectionId: string;
  cameraId: string;
  cameraType: CameraType;
  lotId: string;
  licensePlate: string;
  confidence: number;
  capturedAt: string;
}
