import { Response, NextFunction } from "express";
import { Role } from "@parking/shared";
import { AuthenticatedRequest } from "./auth.middleware";

/**
 * Allows super_admin unconditionally; for other roles, requires
 * req.params.clientId to match the user's own clientId.
 */
export function requireSelfClientOrSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthenticated" });
  }

  if (req.user.role === Role.SUPER_ADMIN) {
    return next();
  }

  if (req.user.clientId && req.user.clientId === req.params.clientId) {
    return next();
  }

  return res.status(403).json({ error: "Forbidden: cross-tenant access denied" });
}
