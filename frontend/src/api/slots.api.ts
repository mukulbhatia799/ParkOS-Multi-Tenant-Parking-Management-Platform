import { apiClient } from "./client";
import { AssignSlotResult, ParkingLot, ParkingSlot } from "../types";

export async function getLots(): Promise<ParkingLot[]> {
  const { data } = await apiClient.get("/lots");
  return data;
}

export async function getSlots(lotId: string): Promise<ParkingSlot[]> {
  const { data } = await apiClient.get(`/lots/${lotId}/slots`);
  return data;
}

export async function assignSlot(
  lotId: string,
  vehicleType?: string,
  entryZoneId?: string
): Promise<AssignSlotResult> {
  const { data } = await apiClient.post("/slots/assign", { lotId, vehicleType, entryZoneId });
  return data;
}
