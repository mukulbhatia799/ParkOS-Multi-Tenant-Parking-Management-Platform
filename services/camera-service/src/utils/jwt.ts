import jwt from "jsonwebtoken";
import { AuthTokenPayload } from "@parking/shared";
import { config } from "../config";

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
}
