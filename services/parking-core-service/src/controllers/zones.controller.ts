import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { resolveClientId } from "../middleware/tenantScope";
import * as zonesService from "../services/zones.service";

export const listZones = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const zones = await zonesService.listZones(clientId, req.params.lotId);
  res.json(zones);
});

export const createZone = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const zone = await zonesService.createZone(clientId, req.params.lotId, req.body);
  res.status(201).json(zone);
});

export const updateZone = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const zone = await zonesService.updateZone(clientId, req.params.zoneId, req.body);
  res.json(zone);
});

export const deleteZone = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  await zonesService.deleteZone(clientId, req.params.zoneId);
  res.status(204).send();
});
