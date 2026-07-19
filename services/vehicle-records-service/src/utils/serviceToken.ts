import jwt from "jsonwebtoken";
import { Role } from "@parking/shared";
import { config } from "../config";

/**
 * Signs a short-lived internal JWT so the Kafka consumer can call other
 * services' authenticated REST endpoints without a user-originated token.
 */
export function signInternalToken(clientId: string): string {
  return jwt.sign(
    {
      sub: "system",
      clientId,
      role: Role.CLIENT_ADMIN,
      email: "system@internal",
    },
    config.jwtSecret,
    { expiresIn: "5m" }
  );
}
