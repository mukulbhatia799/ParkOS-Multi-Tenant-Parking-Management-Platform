import { Role } from "./enums";

export interface AuthTokenPayload {
  sub: string; // userId
  clientId: string | null; // null for super_admin
  role: Role;
  assignedLotIds?: string[];
  email: string;
  iat?: number;
  exp?: number;
}
