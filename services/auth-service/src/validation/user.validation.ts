import { z } from "zod";
import { Role } from "@parking/shared";

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  role: z.nativeEnum(Role),
  assignedLotIds: z.array(z.string()).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.nativeEnum(Role).optional(),
  assignedLotIds: z.array(z.string()).optional(),
  status: z.enum(["active", "disabled"]).optional(),
  password: z.string().min(6).optional(),
});
