import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { resolveClientId } from "../middleware/tenantScope";
import * as lotsService from "../services/lots.service";

export const listLots = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, false);
  const lots = await lotsService.listLots(clientId);
  res.json(lots);
});

export const getLot = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, false);
  const lot = await lotsService.getLot(clientId, req.params.lotId);
  res.json(lot);
});

export const createLot = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const lot = await lotsService.createLot(clientId, req.body);
  res.status(201).json(lot);
});

export const updateLot = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, false);
  const lot = await lotsService.updateLot(clientId, req.params.lotId, req.body);
  res.json(lot);
});

export const deleteLot = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, false);
  await lotsService.deleteLot(clientId, req.params.lotId);
  res.status(204).send();
});
