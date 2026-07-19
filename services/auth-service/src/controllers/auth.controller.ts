import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as authService from "../services/auth.service";
import { AuthenticatedRequest } from "../middleware/auth.middleware";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.json(result);
});

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  const result = await authService.signup(email, password, name);
  res.json(result);
});

export const me = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await authService.getMe(req.user!.sub);
  res.json(user);
});
