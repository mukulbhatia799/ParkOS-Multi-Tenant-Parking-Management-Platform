import { apiClient } from "./client";
import { ParkingRecord, VehicleLocateResult, VehicleType } from "../types";

export async function listActiveRecords(lotId: string): Promise<ParkingRecord[]> {
  const { data } = await apiClient.get("/parking-records", { params: { lotId, status: "active" } });
  return data;
}

export async function createEntry(
  lotId: string,
  slotId: string,
  licensePlate: string,
  vehicleType: VehicleType
): Promise<ParkingRecord> {
  const { data } = await apiClient.post("/parking-records/entry", { lotId, slotId, licensePlate, vehicleType });
  return data;
}

export async function exitRecord(recordId: string): Promise<ParkingRecord> {
  const { data } = await apiClient.post(`/parking-records/${recordId}/exit`);
  return data;
}

export async function locateVehicle(plate: string): Promise<VehicleLocateResult> {
  const { data } = await apiClient.get(`/vehicles/${encodeURIComponent(plate)}/locate`);
  return data;
}
