import { ParkingRecordModel } from "../models/parkingRecord.model";
import { findOrCreateVehicle } from "./vehicles.service";
import { getSlot } from "../clients/parkingCoreClient";
import { AppError } from "../utils/AppError";
import { publishEvent, KafkaTopics } from "../kafka/producer";
import {
  ParkingRecordEntryDetectedPayload,
  ParkingRecordExitDetectedPayload,
  ParkingRecordStatus,
  SlotStatus,
  VehicleType,
} from "@parking/shared";

export async function listRecords(clientId: string, filters: { status?: string; lotId?: string }) {
  const query: Record<string, unknown> = { clientId };
  if (filters.status) query.status = filters.status;
  if (filters.lotId) query.lotId = filters.lotId;

  return ParkingRecordModel.find(query).sort({ entryTime: -1 });
}

export async function getRecord(clientId: string, recordId: string) {
  const record = await ParkingRecordModel.findOne({ _id: recordId, clientId });
  if (!record) throw new AppError("Parking record not found", 404);
  return record;
}

export async function findActiveRecordByPlate(clientId: string, licensePlate: string) {
  const plate = licensePlate.toUpperCase().trim();
  return ParkingRecordModel.findOne({ clientId, licensePlate: plate, status: ParkingRecordStatus.ACTIVE });
}

export async function createEntry(
  clientId: string,
  token: string,
  data: { lotId: string; slotId: string; licensePlate: string; vehicleType?: VehicleType }
) {
  const slot = await getSlot(token, data.slotId);

  if (slot.clientId !== clientId) {
    throw new AppError("Parking slot not found", 404);
  }
  if (slot.lotId !== data.lotId) {
    throw new AppError("Slot does not belong to the specified lot", 400);
  }
  if (slot.status !== SlotStatus.AVAILABLE) {
    throw new AppError(`Slot "${slot.slotNumber}" is not available (status: ${slot.status})`, 409);
  }

  const vehicle = await findOrCreateVehicle(clientId, data.licensePlate, data.vehicleType);

  const entryTime = new Date();
  const record = await ParkingRecordModel.create({
    clientId,
    lotId: slot.lotId,
    zoneId: slot.zoneId,
    slotId: slot._id,
    slotNumber: slot.slotNumber,
    vehicleId: vehicle._id,
    licensePlate: vehicle.licensePlate,
    vehicleType: vehicle.type,
    status: ParkingRecordStatus.ACTIVE,
    entryTime,
  });

  const payload: ParkingRecordEntryDetectedPayload = {
    recordId: record._id.toString(),
    lotId: slot.lotId,
    zoneId: slot.zoneId,
    slotId: slot._id,
    slotNumber: slot.slotNumber,
    vehicleId: vehicle._id.toString(),
    licensePlate: vehicle.licensePlate,
    vehicleType: vehicle.type,
    entryTime: entryTime.toISOString(),
  };
  await publishEvent(
    KafkaTopics.PARKING_RECORD_ENTRY_DETECTED,
    clientId,
    KafkaTopics.PARKING_RECORD_ENTRY_DETECTED,
    payload
  );

  return record;
}

export async function createExit(clientId: string, recordId: string) {
  const record = await ParkingRecordModel.findOne({
    _id: recordId,
    clientId,
    status: ParkingRecordStatus.ACTIVE,
  });
  if (!record) throw new AppError("Active parking record not found", 404);

  const exitTime = new Date();
  const durationMinutes = Math.max(0, Math.round((exitTime.getTime() - record.entryTime.getTime()) / 60000));

  record.status = ParkingRecordStatus.COMPLETED;
  record.exitTime = exitTime;
  record.durationMinutes = durationMinutes;
  await record.save();

  const payload: ParkingRecordExitDetectedPayload = {
    recordId: record._id.toString(),
    lotId: record.lotId.toString(),
    zoneId: record.zoneId.toString(),
    slotId: record.slotId.toString(),
    slotNumber: record.slotNumber,
    vehicleId: record.vehicleId.toString(),
    licensePlate: record.licensePlate,
    exitTime: exitTime.toISOString(),
    durationMinutes,
  };
  await publishEvent(
    KafkaTopics.PARKING_RECORD_EXIT_DETECTED,
    clientId,
    KafkaTopics.PARKING_RECORD_EXIT_DETECTED,
    payload
  );

  return record;
}
