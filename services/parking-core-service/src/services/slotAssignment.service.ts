import { Types } from "mongoose";
import { SlotStatus, SlotType, VehicleType } from "@parking/shared";
import { ParkingSlotModel } from "../models/parkingSlot.model";
import { ParkingZoneModel } from "../models/parkingZone.model";
import { ParkingLotModel } from "../models/parkingLot.model";
import { AppError } from "../utils/AppError";

// Vehicle type → preferred slot types, in priority order
const SLOT_PREFERENCE: Record<string, SlotType[]> = {
  [VehicleType.CAR]:   [SlotType.REGULAR, SlotType.VIP],
  [VehicleType.EV]:    [SlotType.EV, SlotType.REGULAR],
  [VehicleType.BIKE]:  [SlotType.REGULAR],
  [VehicleType.TRUCK]: [SlotType.REGULAR],
};

/**
 * Dijkstra on the zone graph from a given start zone.
 * Returns a map of zoneId → shortest distance.
 */
function dijkstraZoneDistances(
  startZoneId: string,
  zones: Array<{ _id: Types.ObjectId; connections: Array<{ zoneId: Types.ObjectId; distance: number }> }>
): Map<string, number> {
  const dist = new Map<string, number>();
  dist.set(startZoneId, 0);

  const adjacency = new Map<string, Array<{ zoneId: string; weight: number }>>();
  for (const z of zones) {
    adjacency.set(
      z._id.toString(),
      z.connections.map((c) => ({ zoneId: c.zoneId.toString(), weight: c.distance }))
    );
  }

  // Min-heap simulation with a sorted array (small graph — sufficient for lots)
  const queue: { id: string; d: number }[] = [{ id: startZoneId, d: 0 }];

  while (queue.length > 0) {
    queue.sort((a, b) => a.d - b.d);
    const { id, d } = queue.shift()!;

    if (d > (dist.get(id) ?? Infinity)) continue;

    for (const neighbor of adjacency.get(id) ?? []) {
      const newDist = d + neighbor.weight;
      if (newDist < (dist.get(neighbor.zoneId) ?? Infinity)) {
        dist.set(neighbor.zoneId, newDist);
        queue.push({ id: neighbor.zoneId, d: newDist });
      }
    }
  }

  return dist;
}

export async function assignSlot(
  clientId: string,
  lotId: string,
  vehicleType: string = VehicleType.CAR,
  entryZoneId?: string
) {
  const lot = await ParkingLotModel.findOne({
    _id: new Types.ObjectId(lotId),
    clientId: new Types.ObjectId(clientId),
  });
  if (!lot) throw new AppError("Parking lot not found", 404);

  const preferredTypes: SlotType[] = SLOT_PREFERENCE[vehicleType] ?? [SlotType.REGULAR];

  // Fetch all available slots with preferred types
  let candidates = await ParkingSlotModel.find({
    clientId: new Types.ObjectId(clientId),
    lotId: new Types.ObjectId(lotId),
    status: SlotStatus.AVAILABLE,
    type: { $in: preferredTypes },
  }).lean();

  // If no type-matched slots, fall back to any available slot
  if (candidates.length === 0) {
    candidates = await ParkingSlotModel.find({
      clientId: new Types.ObjectId(clientId),
      lotId: new Types.ObjectId(lotId),
      status: SlotStatus.AVAILABLE,
    }).lean();
  }

  if (candidates.length === 0) {
    throw new AppError("No available slots in this lot", 409);
  }

  // If entry zone provided and zone graph exists, sort by Dijkstra distance
  let zoneDistances: Map<string, number> | null = null;
  if (entryZoneId) {
    const zones = await ParkingZoneModel.find({
      clientId: new Types.ObjectId(clientId),
      lotId: new Types.ObjectId(lotId),
    }).lean();
    if (zones.some((z) => z.connections.length > 0)) {
      zoneDistances = dijkstraZoneDistances(entryZoneId, zones);
    }
  }

  candidates.sort((a, b) => {
    // 1. Preferred slot type rank (lower = better)
    const rankA = preferredTypes.indexOf(a.type as SlotType);
    const rankB = preferredTypes.indexOf(b.type as SlotType);
    const ra = rankA === -1 ? 99 : rankA;
    const rb = rankB === -1 ? 99 : rankB;
    if (ra !== rb) return ra - rb;

    // 2. Zone graph distance from entry (lower = closer)
    if (zoneDistances) {
      const da = zoneDistances.get(a.zoneId.toString()) ?? Infinity;
      const db = zoneDistances.get(b.zoneId.toString()) ?? Infinity;
      if (da !== db) return da - db;
    }

    // 3. Slot number (alphanumeric)
    return a.slotNumber.localeCompare(b.slotNumber, undefined, { numeric: true });
  });

  const winner = candidates[0];

  // Re-fetch as a Mongoose document (lean() returns plain objects)
  const slot = await ParkingSlotModel.findById(winner._id);
  if (!slot) throw new AppError("Slot disappeared during assignment", 409);
  return slot;
}
