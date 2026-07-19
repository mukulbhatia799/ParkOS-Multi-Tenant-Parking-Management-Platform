import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { resolveClientId } from "../middleware/tenantScope";
import { asyncHandler } from "../utils/asyncHandler";
import * as service from "../services/billing.service";

export const listBilling = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const records = await service.listBilling(clientId, {
    lotId: req.query.lotId as string | undefined,
    parkingRecordId: req.query.parkingRecordId as string | undefined,
  });
  res.json(records);
});

export const getBillingByRecord = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const record = await service.getBillingByRecord(clientId, req.params.parkingRecordId);
  res.json(record);
});
