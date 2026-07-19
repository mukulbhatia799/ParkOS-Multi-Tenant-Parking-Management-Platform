import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { resolveClientId, operatorLotScope } from "../middleware/tenantScope";
import * as recordsService from "../services/records.service";

export const listRecords = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const { status, lotId } = req.query;
  const records = await recordsService.listRecords(clientId, {
    status: status as string | undefined,
    lotId: lotId as string | undefined,
  });
  res.json(records);
});

export const getRecord = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const record = await recordsService.getRecord(clientId, req.params.recordId);
  res.json(record);
});

export const createEntry = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  operatorLotScope(req, req.body.lotId);

  const record = await recordsService.createEntry(clientId, req.token!, req.body);
  res.status(201).json(record);
});

export const createExit = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const record = await recordsService.createExit(clientId, req.params.recordId);
  res.json(record);
});
