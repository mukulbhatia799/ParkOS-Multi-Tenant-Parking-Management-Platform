import { Request, Response, NextFunction } from "express";
import { config } from "../config";

/**
 * Guards internal service-to-service endpoints (e.g. cv-service -> camera-service)
 * that have no end-user JWT. Checks a shared secret header instead.
 */
export function internalAuth(req: Request, res: Response, next: NextFunction) {
  const key = req.headers["x-internal-api-key"];
  if (key !== config.internalApiKey) {
    return res.status(401).json({ error: "Invalid or missing internal API key" });
  }
  return next();
}
