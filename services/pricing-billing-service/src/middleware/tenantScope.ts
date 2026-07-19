import { Role } from "@parking/shared";
import { AuthenticatedRequest } from "./auth.middleware";
import { AppError } from "../utils/AppError";

export function resolveClientId(req: AuthenticatedRequest, required = true): string | undefined {
  if (!req.user) throw new AppError("Unauthenticated", 401);
  if (req.user.role === Role.SUPER_ADMIN) {
    const clientId = (req.query.clientId as string | undefined) || (req.body?.clientId as string | undefined);
    if (required && !clientId) throw new AppError("clientId is required for super_admin requests", 400);
    return clientId;
  }
  if (!req.user.clientId) throw new AppError("User is not associated with a client", 403);
  return req.user.clientId;
}
