import { ParkingZoneModel } from "../models/parkingZone.model";
import { ParkingLotModel } from "../models/parkingLot.model";
import { AppError } from "../utils/AppError";

async function assertLotExists(clientId: string, lotId: string) {
  const lot = await ParkingLotModel.findOne({ _id: lotId, clientId });
  if (!lot) throw new AppError("Parking lot not found", 404);
  return lot;
}

export async function listZones(clientId: string, lotId: string) {
  await assertLotExists(clientId, lotId);
  return ParkingZoneModel.find({ clientId, lotId }).sort({ createdAt: 1 });
}

export async function createZone(clientId: string, lotId: string, data: Record<string, unknown>) {
  await assertLotExists(clientId, lotId);
  return ParkingZoneModel.create({ ...data, clientId, lotId });
}

export async function updateZone(clientId: string, zoneId: string, data: Record<string, unknown>) {
  const zone = await ParkingZoneModel.findOneAndUpdate({ _id: zoneId, clientId }, data, { new: true });
  if (!zone) throw new AppError("Parking zone not found", 404);
  return zone;
}

export async function deleteZone(clientId: string, zoneId: string) {
  const zone = await ParkingZoneModel.findOneAndDelete({ _id: zoneId, clientId });
  if (!zone) throw new AppError("Parking zone not found", 404);
  return zone;
}
