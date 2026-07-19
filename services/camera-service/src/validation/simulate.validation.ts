import { z } from "zod";

export const startSimulationSchema = z.object({
  plates: z.array(z.string().min(1)).optional(),
  intervalSeconds: z.number().int().positive().optional(),
});

export const ingestDetectionSchema = z.object({
  cameraId: z.string().min(1),
  licensePlate: z.string().min(1),
  confidence: z.number().min(0).max(1),
  capturedAt: z.string().optional(),
});
