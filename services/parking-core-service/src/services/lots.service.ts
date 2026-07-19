import { ParkingLotModel } from "../models/parkingLot.model";
import { AppError } from "../utils/AppError";

export async function listLots(clientId: string | undefined) {
  const filter = clientId ? { clientId } : {};
  return ParkingLotModel.find(filter).sort({ createdAt: -1 });
}

export async function getLot(clientId: string | undefined, lotId: string) {
  const filter: Record<string, unknown> = { _id: lotId };
  if (clientId) filter.clientId = clientId;

  const lot = await ParkingLotModel.findOne(filter);
  if (!lot) throw new AppError("Parking lot not found", 404);
  return lot;
}

export async function createLot(clientId: string, data: Record<string, unknown>) {
  const { clientId: _ignored, ...rest } = data;
  return ParkingLotModel.create({ ...rest, clientId });
}

export async function updateLot(clientId: string | undefined, lotId: string, data: Record<string, unknown>) {
  const filter: Record<string, unknown> = { _id: lotId };
  if (clientId) filter.clientId = clientId;

  const lot = await ParkingLotModel.findOneAndUpdate(filter, data, { new: true });
  if (!lot) throw new AppError("Parking lot not found", 404);
  return lot;
}

export async function deleteLot(clientId: string | undefined, lotId: string) {
  const filter: Record<string, unknown> = { _id: lotId };
  if (clientId) filter.clientId = clientId;

  const lot = await ParkingLotModel.findOneAndDelete(filter);
  if (!lot) throw new AppError("Parking lot not found", 404);
  return lot;
}
