export function tenantRoom(clientId: string): string {
  return `tenant:${clientId}`;
}

export function lotRoom(clientId: string, lotId: string): string {
  return `tenant:${clientId}:lot:${lotId}`;
}
