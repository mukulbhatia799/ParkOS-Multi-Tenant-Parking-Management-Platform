import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { resolveClientId } from "../middleware/tenantScope";
import * as vehiclesService from "../services/vehicles.service";

export const listVehicles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const vehicles = await vehiclesService.listVehicles(clientId);
  res.json(vehicles);
});

export const createVehicle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const vehicle = await vehiclesService.createVehicle(clientId, req.body);
  res.status(201).json(vehicle);
});

export const locateVehicle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const result = await vehiclesService.locateVehicle(clientId, req.params.plate);
  res.json(result);
});
