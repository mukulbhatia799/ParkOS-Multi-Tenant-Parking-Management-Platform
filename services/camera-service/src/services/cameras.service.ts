import { CameraModel } from "../models/camera.model";
import { AppError } from "../utils/AppError";
import { startSimulation, stopSimulation } from "../clients/cvServiceClient";
import { CameraStatus } from "@parking/shared";

export async function listCameras(clientId: string, lotId?: string) {
  const query: Record<string, unknown> = { clientId };
  if (lotId) query.lotId = lotId;
  return CameraModel.find(query).sort({ createdAt: -1 });
}

export async function createCamera(clientId: string, data: Record<string, unknown>) {
  return CameraModel.create({ ...data, clientId });
}

export async function updateCamera(clientId: string, cameraId: string, data: Record<string, unknown>) {
  const camera = await CameraModel.findOne({ _id: cameraId, clientId });
  if (!camera) throw new AppError("Camera not found", 404);

  Object.assign(camera, data);
  await camera.save();
  return camera;
}

export async function deleteCamera(clientId: string, cameraId: string) {
  const camera = await CameraModel.findOneAndDelete({ _id: cameraId, clientId });
  if (!camera) throw new AppError("Camera not found", 404);
  return camera;
}

async function getOwnedCamera(clientId: string, cameraId: string) {
  const camera = await CameraModel.findOne({ _id: cameraId, clientId });
  if (!camera) throw new AppError("Camera not found", 404);
  return camera;
}

export async function startCameraSimulation(
  clientId: string,
  cameraId: string,
  opts?: { plates?: string[]; intervalSeconds?: number }
) {
  const camera = await getOwnedCamera(clientId, cameraId);
  if (camera.status !== CameraStatus.ACTIVE) {
    throw new AppError(`Camera "${camera.name}" is not active`, 409);
  }
  await startSimulation(camera._id.toString(), opts);
  return camera;
}

export async function stopCameraSimulation(clientId: string, cameraId: string) {
  const camera = await getOwnedCamera(clientId, cameraId);
  await stopSimulation(camera._id.toString());
  return camera;
}
