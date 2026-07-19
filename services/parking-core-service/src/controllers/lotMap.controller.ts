import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { resolveClientId } from "../middleware/tenantScope";
import * as lotMapService from "../services/lotMap.service";

export const listLevels = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, false)!;
  const levels = await lotMapService.listLevels(clientId, req.params.lotId);
  res.json(levels);
});

export const getLevel = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, false)!;
  const level = parseInt(req.params.level, 10);
  if (isNaN(level) || level < 1) return res.status(400).json({ error: "Invalid level number" });
  const map = await lotMapService.getLevel(clientId, req.params.lotId, level);
  res.json(map);
});

export const saveLevel = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, false)!;
  const level = parseInt(req.params.level, 10);
  if (isNaN(level) || level < 1) return res.status(400).json({ error: "Invalid level number" });
  const { cells = [], levelName } = req.body;
  if (!Array.isArray(cells)) return res.status(400).json({ error: "cells must be an array" });
  const map = await lotMapService.saveLevel(clientId, req.params.lotId, level, cells, levelName);
  res.json(map);
});

export const copyLevel = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, false)!;
  const toLevel = parseInt(req.params.level, 10);
  const fromLevel = parseInt(req.body.fromLevel, 10);
  if (isNaN(toLevel) || toLevel < 1) return res.status(400).json({ error: "Invalid target level" });
  if (isNaN(fromLevel) || fromLevel < 1) return res.status(400).json({ error: "Invalid source level" });
  const map = await lotMapService.copyLevel(clientId, req.params.lotId, toLevel, fromLevel);
  res.json(map);
});

export const deleteLevel = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, false)!;
  const level = parseInt(req.params.level, 10);
  if (isNaN(level) || level < 1) return res.status(400).json({ error: "Invalid level number" });
  await lotMapService.deleteLevel(clientId, req.params.lotId, level);
  res.status(204).send();
});
