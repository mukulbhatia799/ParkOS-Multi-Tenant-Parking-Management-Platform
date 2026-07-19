import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthTokenPayload } from "@parking/shared";
import { config } from "../config";

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

/**
 * Verifies the JWT at the gateway so downstream services receive a
 * pre-validated token. Public routes (login) skip this via route ordering.
 */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  const token = header.slice("Bearer ".length);
  try {
    req.user = jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
