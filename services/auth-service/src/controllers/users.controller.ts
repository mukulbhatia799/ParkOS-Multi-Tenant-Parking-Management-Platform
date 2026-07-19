import { Response } from "express";
import { Role } from "@parking/shared";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import * as userService from "../services/user.service";

function resolveClientId(req: AuthenticatedRequest): string | null {
  // super_admin operating on the platform-level route uses params.clientId ("platform" => null)
  if (req.user!.role === Role.SUPER_ADMIN && req.params.clientId === "platform") {
    return null;
  }
  return req.params.clientId;
}

export const listUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req);
  const users = await userService.listUsers(clientId);
  res.json(users);
});

export const createUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req);
  const user = await userService.createUser(clientId, req.body);
  res.status(201).json(user);
});

export const updateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req);
  const user = await userService.updateUser(clientId, req.params.userId, req.body);
  res.json(user);
});

export const deleteUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const clientId = resolveClientId(req);
  await userService.deleteUser(clientId, req.params.userId);
  res.status(204).send();
});
