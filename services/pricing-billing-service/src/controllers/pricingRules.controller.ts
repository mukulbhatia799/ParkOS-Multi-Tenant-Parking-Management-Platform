import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { resolveClientId } from "../middleware/tenantScope";
import { asyncHandler } from "../utils/asyncHandler";
import * as service from "../services/pricingRules.service";

export const listRules = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const rules = await service.listRules(clientId, req.query.lotId as string | undefined);
  res.json(rules);
});

export const createRule = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const rule = await service.createRule(clientId, req.body);
  res.status(201).json(rule);
});

export const updateRule = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const rule = await service.updateRule(clientId, req.params.ruleId, req.body);
  res.json(rule);
});

export const deleteRule = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  await service.deleteRule(clientId, req.params.ruleId);
  res.status(204).send();
});
