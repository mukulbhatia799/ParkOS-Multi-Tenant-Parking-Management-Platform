import { Role } from "@parking/shared";
import { UserModel } from "../models/user.model";
import { AppError } from "../utils/AppError";
import { hashPassword } from "../utils/password";
import { publishEvent, KafkaTopics } from "../kafka/producer";

export async function listUsers(clientId: string | null) {
  const filter = clientId ? { clientId } : {};
  return UserModel.find(filter).select("-passwordHash").sort({ createdAt: -1 });
}

export async function createUser(clientId: string | null, data: Record<string, any>) {
  const existing = await UserModel.findOne({ email: data.email.toLowerCase().trim() });
  if (existing) throw new AppError("Email already in use", 409);

  if (data.role === Role.SUPER_ADMIN && clientId) {
    throw new AppError("super_admin users cannot belong to a client", 400);
  }

  const passwordHash = data.password ? await hashPassword(data.password) : undefined;

  const user = await UserModel.create({
    clientId: clientId ?? null,
    name: data.name,
    email: data.email.toLowerCase().trim(),
    passwordHash,
    role: data.role,
    assignedLotIds: data.assignedLotIds ?? [],
    status: data.password ? "active" : "invited",
  });

  await publishEvent(KafkaTopics.USER_CREATED, clientId ?? "platform", KafkaTopics.USER_CREATED, {
    userId: user._id.toString(),
    clientId: clientId ?? null,
    role: user.role,
  });

  const { passwordHash: _omit, ...rest } = user.toObject();
  return rest;
}

export async function updateUser(clientId: string | null, userId: string, data: Record<string, any>) {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  if (clientId && user.clientId?.toString() !== clientId) {
    throw new AppError("Forbidden: cross-tenant access denied", 403);
  }

  if (data.name !== undefined) user.name = data.name;
  if (data.role !== undefined) user.role = data.role;
  if (data.assignedLotIds !== undefined) user.assignedLotIds = data.assignedLotIds;
  if (data.status !== undefined) user.status = data.status;
  if (data.password) user.passwordHash = await hashPassword(data.password);

  await user.save();
  const { passwordHash: _omit, ...rest } = user.toObject();
  return rest;
}

export async function deleteUser(clientId: string | null, userId: string) {
  const user = await UserModel.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  if (clientId && user.clientId?.toString() !== clientId) {
    throw new AppError("Forbidden: cross-tenant access denied", 403);
  }

  await user.deleteOne();
}
