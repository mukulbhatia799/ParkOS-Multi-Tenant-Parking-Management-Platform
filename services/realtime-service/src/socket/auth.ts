import jwt from "jsonwebtoken";
import { Socket } from "socket.io";
import { AuthTokenPayload } from "@parking/shared";
import { config } from "../config";

export interface AuthenticatedSocket extends Socket {
  user?: AuthTokenPayload;
}

export function socketAuthMiddleware(socket: AuthenticatedSocket, next: (err?: Error) => void) {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;

  if (!token || typeof token !== "string") {
    return next(new Error("Authentication token required"));
  }

  try {
    socket.user = jwt.verify(token, config.jwtSecret) as AuthTokenPayload;
    return next();
  } catch {
    return next(new Error("Invalid or expired token"));
  }
}
