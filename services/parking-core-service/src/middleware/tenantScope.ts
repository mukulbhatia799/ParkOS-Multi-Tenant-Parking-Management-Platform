import { Response, NextFunction } from "express";
import { Role } from "@parking/shared";
import { AuthenticatedRequest } from "./auth.middleware";
import { AppError } from "../utils/AppError";

/**
 * Resolves the clientId to scope a request to.
 * - super_admin: may pass ?clientId=<id> (required for list/create); falls back to undefined (no filter) for by-id ops.
 * - client_admin / operator: always scoped to their own clientId, ignoring any client-supplied value.
 */
export function resolveClientId(req: AuthenticatedRequest, required = true): string | undefined {
  if (!req.user) throw new AppError("Unauthenticated", 401);

  if (req.user.role === Role.SUPER_ADMIN) {
    const clientId = (req.query.clientId as string | undefined) || (req.body?.clientId as string | undefined);
    if (required && !clientId) {
      throw new AppError("clientId is required for super_admin requests", 400);
    }
    return clientId;
  }

  if (!req.user.clientId) {
    throw new AppError("User is not associated with a client", 403);
  }

  return req.user.clientId;
}

export function operatorLotScope(req: AuthenticatedRequest, lotId: string) {
  if (req.user?.role === Role.OPERATOR) {
    const assigned = req.user.assignedLotIds || [];
    if (assigned.length > 0 && !assigned.includes(lotId)) {
      throw new AppError("Forbidden: operator not assigned to this lot", 403);
    }
  }
}
