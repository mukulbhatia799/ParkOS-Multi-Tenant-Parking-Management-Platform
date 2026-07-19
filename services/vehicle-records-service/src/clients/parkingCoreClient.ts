import axios from "axios";
import { ParkingSlot, SlotStatus } from "@parking/shared";
import { config } from "../config";
import { AppError } from "../utils/AppError";

export async function getSlot(token: string, slotId: string): Promise<ParkingSlot> {
  try {
    const res = await axios.get<ParkingSlot>(`${config.parkingCoreServiceUrl}/slots/${slotId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      if (err.response.status === 404) {
        throw new AppError("Parking slot not found", 404);
      }
      throw new AppError(err.response.data?.error || "Failed to fetch slot from parking-core-service", err.response.status);
    }
    throw new AppError("parking-core-service is unavailable", 503);
  }
}

/**
 * Smart slot assignment: picks the best available slot for the given vehicle type,
 * using zone-graph distance from the entry zone (if known).
 * Returns null if the lot is full (409 from parking-core treated as "lot full").
 */
export async function assignSlot(
  token: string,
  lotId: string,
  vehicleType?: string,
  entryZoneId?: string
): Promise<ParkingSlot | null> {
  try {
    const res = await axios.post<{ slot: ParkingSlot }>(
      `${config.parkingCoreServiceUrl}/slots/assign`,
      { lotId, vehicleType, entryZoneId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data.slot;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      if (err.response.status === 409) return null; // lot full
      throw new AppError(
        err.response.data?.error || "Failed to assign slot from parking-core-service",
        err.response.status
      );
    }
    throw new AppError("parking-core-service is unavailable", 503);
  }
}
