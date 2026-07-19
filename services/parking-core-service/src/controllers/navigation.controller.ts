import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { resolveClientId } from "../middleware/tenantScope";
import * as navigationService from "../services/navigation.service";

export const getRoute = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req, true)!;
  const { lotId, fromZoneId, toZoneId } = req.query as Record<string, string>;

  if (!lotId || !fromZoneId || !toZoneId) {
    return res.status(400).json({ error: "lotId, fromZoneId and toZoneId are required" });
  }

  const route = await navigationService.findRoute(clientId, lotId, fromZoneId, toZoneId);
  res.json({ route });
});
