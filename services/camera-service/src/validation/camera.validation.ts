import { z } from "zod";
import { CameraStatus, CameraType } from "@parking/shared";

export const createCameraSchema = z.object({
  lotId: z.string().min(1),
  name: z.string().min(1),
  cameraType: z.nativeEnum(CameraType),
  status: z.nativeEnum(CameraStatus).optional(),
});

export const updateCameraSchema = z.object({
  name: z.string().min(1).optional(),
  cameraType: z.nativeEnum(CameraType).optional(),
  status: z.nativeEnum(CameraStatus).optional(),
});
