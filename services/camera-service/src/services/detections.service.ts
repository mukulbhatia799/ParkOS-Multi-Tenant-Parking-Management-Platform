import { CameraModel } from "../models/camera.model";
import { DetectionLogModel } from "../models/detectionLog.model";
import { AppError } from "../utils/AppError";
import { publishEvent, KafkaTopics } from "../kafka/producer";
import { scanPlate } from "../clients/cvServiceClient";
import { CameraStatus, CvPlateDetectedPayload, DetectionStatus } from "@parking/shared";

export async function listDetections(clientId: string, filters: { lotId?: string; cameraId?: string }) {
  const query: Record<string, unknown> = { clientId };
  if (filters.lotId) query.lotId = filters.lotId;
  if (filters.cameraId) query.cameraId = filters.cameraId;

  return DetectionLogModel.find(query).sort({ createdAt: -1 }).limit(50);
}

export async function ingestDetection(data: {
  cameraId: string;
  licensePlate: string;
  confidence: number;
  capturedAt?: string;
}) {
  const camera = await CameraModel.findById(data.cameraId);
  if (!camera) throw new AppError("Camera not found", 404);
  if (camera.status !== CameraStatus.ACTIVE) {
    throw new AppError(`Camera "${camera.name}" is not active`, 409);
  }

  const licensePlate = data.licensePlate.toUpperCase().trim();
  const capturedAt = data.capturedAt ? new Date(data.capturedAt) : new Date();

  const detection = await DetectionLogModel.create({
    clientId: camera.clientId,
    cameraId: camera._id,
    lotId: camera.lotId,
    cameraType: camera.cameraType,
    licensePlate,
    confidence: data.confidence,
    capturedAt,
    status: DetectionStatus.PUBLISHED,
  });

  const payload: CvPlateDetectedPayload = {
    detectionId: detection._id.toString(),
    cameraId: camera._id.toString(),
    cameraType: camera.cameraType,
    lotId: camera.lotId.toString(),
    licensePlate,
    confidence: data.confidence,
    capturedAt: capturedAt.toISOString(),
  };

  const clientId = camera.clientId.toString();
  await publishEvent(KafkaTopics.CV_PLATE_DETECTED, clientId, KafkaTopics.CV_PLATE_DETECTED, payload);

  return detection;
}

export async function scanAndIngest(clientId: string, cameraId: string, imageBase64: string) {
  const camera = await CameraModel.findOne({ _id: cameraId, clientId });
  if (!camera) throw new AppError("Camera not found", 404);
  if (camera.status !== CameraStatus.ACTIVE) {
    throw new AppError(`Camera "${camera.name}" is not active`, 409);
  }

  const result = await scanPlate(imageBase64);
  if (!result.licensePlate) {
    return { detected: false as const };
  }

  const detection = await ingestDetection({
    cameraId: camera._id.toString(),
    licensePlate: result.licensePlate,
    confidence: result.confidence,
  });

  return { detected: true as const, detection };
}
