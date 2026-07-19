import rateLimit from "express-rate-limit";
import { AuthenticatedRequest } from "./auth.middleware";

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: AuthenticatedRequest) => req.user?.clientId || req.ip || "anonymous",
});
