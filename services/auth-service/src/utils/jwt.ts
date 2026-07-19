import jwt from "jsonwebtoken";
import { AuthTokenPayload } from "@parking/shared";
import { config } from "../config";

export function signAccessToken(payload: AuthTokenPayload): string {
  const { iat, exp, ...rest } = payload;
  return jwt.sign(rest, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
}
