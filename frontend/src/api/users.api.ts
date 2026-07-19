import { apiClient } from "./client";
import { AppUser, Role, UserStatus } from "../types";

export async function listUsers(clientId: string): Promise<AppUser[]> {
  const { data } = await apiClient.get(`/clients/${clientId}/users`);
  return data;
}

export async function inviteUser(
  clientId: string,
  body: { name: string; email: string; role: Role }
): Promise<AppUser> {
  const { data } = await apiClient.post(`/clients/${clientId}/users`, body);
  return data;
}

export async function updateUser(
  clientId: string,
  userId: string,
  body: Partial<{ name: string; role: Role; status: UserStatus; assignedLotIds: string[] }>
): Promise<AppUser> {
  const { data } = await apiClient.patch(`/clients/${clientId}/users/${userId}`, body);
  return data;
}

export async function deleteUser(clientId: string, userId: string): Promise<void> {
  await apiClient.delete(`/clients/${clientId}/users/${userId}`);
}
