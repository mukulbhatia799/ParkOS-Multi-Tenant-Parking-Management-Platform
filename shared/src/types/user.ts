import { Role } from "./enums";

export interface User {
  _id: string;
  clientId: string | null;
  name: string;
  email: string;
  role: Role;
  assignedLotIds: string[];
  status: "invited" | "active" | "disabled";
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}
