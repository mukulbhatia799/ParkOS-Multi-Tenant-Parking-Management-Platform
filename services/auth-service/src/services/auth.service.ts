import { AuthTokenPayload } from "@parking/shared";
import { UserDocument, UserModel } from "../models/user.model";
import { comparePassword, hashPassword } from "../utils/password";
import { signAccessToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";

function issueSession(user: UserDocument): { token: string; user: AuthTokenPayload } {
  const payload: AuthTokenPayload = {
    sub: user._id.toString(),
    clientId: user.clientId ? user.clientId.toString() : null,
    role: user.role,
    assignedLotIds: user.assignedLotIds.map((id) => id.toString()),
    email: user.email,
  };

  const token = signAccessToken(payload);
  return { token, user: payload };
}

export async function login(email: string, password: string): Promise<{ token: string; user: AuthTokenPayload }> {
  const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
  if (!user || user.status !== "active" || !user.passwordHash) {
    throw new AppError("Invalid credentials", 401);
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new AppError("Invalid credentials", 401);
  }

  user.lastLoginAt = new Date();
  await user.save();

  return issueSession(user);
}

export async function signup(
  email: string,
  password: string,
  name?: string
): Promise<{ token: string; user: AuthTokenPayload }> {
  const user = await UserModel.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw new AppError("No invitation found for this email. Ask your admin for access.", 404);
  }
  if (user.status !== "invited") {
    throw new AppError("This account is already active or has been disabled.", 409);
  }

  user.passwordHash = await hashPassword(password);
  user.status = "active";
  if (name) user.name = name;
  user.lastLoginAt = new Date();
  await user.save();

  return issueSession(user);
}

export async function getMe(userId: string) {
  const user = await UserModel.findById(userId).select("-passwordHash");
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return user;
}
