import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as detectionsService from "../services/detections.service";

export const ingestDetection = asyncHandler(async (req: Request, res: Response) => {
  const detection = await detectionsService.ingestDetection(req.body);
  res.status(202).json(detection);
});
