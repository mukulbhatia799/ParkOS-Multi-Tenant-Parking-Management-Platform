import { CameraStatus, CameraType } from "./enums";

export interface Camera {
  _id: string;
  clientId: string;
  lotId: string;
  name: string;
  cameraType: CameraType;
  status: CameraStatus;
  createdAt: string;
  updatedAt: string;
}
