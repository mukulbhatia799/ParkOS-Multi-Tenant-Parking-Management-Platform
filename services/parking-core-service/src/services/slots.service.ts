import { Types } from "mongoose";
import { ParkingSlotModel } from "../models/parkingSlot.model";
import { ParkingLotModel } from "../models/parkingLot.model";
import { AppError } from "../utils/AppError";
import { publishEvent, KafkaTopics } from "../kafka/producer";
import { SlotStatus, SlotStatusChangedPayload } from "@parking/shared";

async function assertLotExists(clientId: string, lotId: string) {
  const lot = await ParkingLotModel.findOne({ _id: lotId, clientId });
  if (!lot) throw new AppError("Parking lot not found", 404);
  return lot;
}

export async function listSlots(
  clientId: string,
  lotId: string,
  filters: { status?: string; type?: string; zoneId?: string }
) {
  await assertLotExists(clientId, lotId);

  const query: Record<string, unknown> = { clientId, lotId };
  if (filters.status) query.status = filters.status;
  if (filters.type) query.type = filters.type;
  if (filters.zoneId) query.zoneId = filters.zoneId;

  return ParkingSlotModel.find(query).sort({ slotNumber: 1 });
}

export async function createSlot(clientId: string, lotId: string, data: Record<string, unknown>) {
  await assertLotExists(clientId, lotId);

  const existing = await ParkingSlotModel.findOne({ clientId, lotId, slotNumber: data.slotNumber });
  if (existing) throw new AppError(`Slot number "${data.slotNumber}" already exists in this lot`, 409);

  return ParkingSlotModel.create({ ...data, clientId, lotId });
}

export async function bulkCreateSlots(clientId: string, lotId: string, slots: Record<string, unknown>[]) {
  await assertLotExists(clientId, lotId);

  const docs = slots.map((s) => ({ ...s, clientId, lotId }));
  return ParkingSlotModel.insertMany(docs, { ordered: false });
}

export async function updateSlot(clientId: string, slotId: string, data: Record<string, unknown>) {
  const slot = await ParkingSlotModel.findOne({ _id: slotId, clientId });
  if (!slot) throw new AppError("Parking slot not found", 404);

  const previousStatus = slot.status;

  Object.assign(slot, data);
  await slot.save();

  if (data.status && data.status !== previousStatus) {
    const payload: SlotStatusChangedPayload = {
      lotId: slot.lotId.toString(),
      zoneId: slot.zoneId.toString(),
      slotId: slot._id.toString(),
      slotNumber: slot.slotNumber,
      type: slot.type,
      previousStatus,
      status: slot.status,
    };
    await publishEvent(KafkaTopics.SLOT_STATUS_CHANGED, clientId, KafkaTopics.SLOT_STATUS_CHANGED, payload);
  }

  return slot;
}

export async function deleteSlot(clientId: string, slotId: string) {
  const slot = await ParkingSlotModel.findOneAndDelete({ _id: slotId, clientId });
  if (!slot) throw new AppError("Parking slot not found", 404);
  return slot;
}

export async function getSlotById(clientId: string, slotId: string) {
  const slot = await ParkingSlotModel.findOne({ _id: slotId, clientId });
  if (!slot) throw new AppError("Parking slot not found", 404);
  return slot;
}

/**
 * Applies an occupancy change driven by a Kafka event (entry/exit detected
 * by vehicle-records-service) and publishes slot.statusChanged.
 */
export async function applyOccupancyChange(
  clientId: string,
  slotId: string,
  status: SlotStatus,
  recordId: string | null
) {
  const slot = await ParkingSlotModel.findOne({ _id: slotId, clientId });
  if (!slot) {
    console.warn(`[parking-core-service] applyOccupancyChange: slot ${slotId} not found for client ${clientId}`);
    return;
  }

  const previousStatus = slot.status;
  if (previousStatus === status) return;

  slot.status = status;
  slot.currentRecordId = recordId ? new Types.ObjectId(recordId) : null;
  await slot.save();

  const payload: SlotStatusChangedPayload = {
    lotId: slot.lotId.toString(),
    zoneId: slot.zoneId.toString(),
    slotId: slot._id.toString(),
    slotNumber: slot.slotNumber,
    type: slot.type,
    previousStatus,
    status: slot.status,
  };
  await publishEvent(KafkaTopics.SLOT_STATUS_CHANGED, clientId, KafkaTopics.SLOT_STATUS_CHANGED, payload);
}
