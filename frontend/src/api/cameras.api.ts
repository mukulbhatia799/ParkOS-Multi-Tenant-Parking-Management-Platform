import { apiClient } from "./client";
import { Camera, DetectionLog, ScanResult } from "../types";

export async function getCameras(lotId: string): Promise<Camera[]> {
  const { data } = await apiClient.get("/cameras", { params: { lotId } });
  return data;
}

export async function getDetections(lotId: string): Promise<DetectionLog[]> {
  const { data } = await apiClient.get("/detections", { params: { lotId } });
  return data;
}

export async function startSimulation(
  cameraId: string,
  opts?: { plates?: string[]; intervalSeconds?: number }
): Promise<void> {
  await apiClient.post(`/cameras/${cameraId}/simulate/start`, opts || {});
}

export async function stopSimulation(cameraId: string): Promise<void> {
  await apiClient.post(`/cameras/${cameraId}/simulate/stop`);
}

export async function scanCamera(cameraId: string, imageBase64: string): Promise<ScanResult> {
  const { data } = await apiClient.post(`/cameras/${cameraId}/scan`, { image: imageBase64 });
  return data;
}
