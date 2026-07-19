import axios from "axios";
import { config } from "../config";

export async function startSimulation(
  cameraId: string,
  opts?: { plates?: string[]; intervalSeconds?: number }
): Promise<void> {
  await axios.post(
    `${config.cvServiceUrl}/cv/simulate/start`,
    { cameraId, ...opts },
    { headers: { "X-Internal-Api-Key": config.internalApiKey } }
  );
}

export async function stopSimulation(cameraId: string): Promise<void> {
  await axios.post(
    `${config.cvServiceUrl}/cv/simulate/stop`,
    { cameraId },
    { headers: { "X-Internal-Api-Key": config.internalApiKey } }
  );
}

export async function scanPlate(imageBase64: string): Promise<{ licensePlate: string | null; confidence: number }> {
  const res = await axios.post<{ licensePlate: string | null; confidence: number }>(
    `${config.cvServiceUrl}/cv/ocr`,
    { image: imageBase64 },
    { headers: { "X-Internal-Api-Key": config.internalApiKey }, timeout: 60000 }
  );
  return res.data;
}
