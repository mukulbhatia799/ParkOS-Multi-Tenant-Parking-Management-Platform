import { apiClient } from "./client";
import { AuthUser } from "../types";

export async function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const { data } = await apiClient.post("/auth/login", { email, password });
  return data;
}

export async function signup(
  email: string,
  password: string,
  name?: string
): Promise<{ token: string; user: AuthUser }> {
  const { data } = await apiClient.post("/auth/signup", { email, password, name });
  return data;
}
