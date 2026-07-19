import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { resolveClientId } from "../middleware/tenantScope";
import * as camerasService from "../services/cameras.service";
import * as detectionsService from "../services/detections.service";

export const listCameras = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const { lotId } = req.query;
  const cameras = await camerasService.listCameras(clientId, lotId as string | undefined);
  res.json(cameras);
});

export const createCamera = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const camera = await camerasService.createCamera(clientId, req.body);
  res.status(201).json(camera);
});

export const updateCamera = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const camera = await camerasService.updateCamera(clientId, req.params.cameraId, req.body);
  res.json(camera);
});

export const deleteCamera = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  await camerasService.deleteCamera(clientId, req.params.cameraId);
  res.status(204).send();
});

export const startSimulation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const camera = await camerasService.startCameraSimulation(clientId, req.params.cameraId, req.body);
  res.json({ camera, simulating: true });
});

export const stopSimulation = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const camera = await camerasService.stopCameraSimulation(clientId, req.params.cameraId);
  res.json({ camera, simulating: false });
});

export const scanCamera = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const result = await detectionsService.scanAndIngest(clientId, req.params.cameraId, req.body.image);
  res.json(result);
});
