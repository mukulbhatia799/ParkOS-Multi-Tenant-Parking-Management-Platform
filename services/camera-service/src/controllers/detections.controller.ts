import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { resolveClientId } from "../middleware/tenantScope";
import * as detectionsService from "../services/detections.service";

export const listDetections = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const { lotId, cameraId } = req.query;
  const detections = await detectionsService.listDetections(clientId, {
    lotId: lotId as string | undefined,
    cameraId: cameraId as string | undefined,
  });
  res.json(detections);
});
