import { Types } from "mongoose";
import { ParkingZoneModel } from "../models/parkingZone.model";
import { ParkingLotModel } from "../models/parkingLot.model";
import { AppError } from "../utils/AppError";

export interface NavigationStep {
  zoneId: string;
  zoneName: string;
  edgeType?: "walkway" | "ramp" | "elevator";
  distance?: number;
  cumulativeDistance: number;
}

export async function findRoute(
  clientId: string,
  lotId: string,
  fromZoneId: string,
  toZoneId: string
): Promise<NavigationStep[]> {
  const lot = await ParkingLotModel.findOne({
    _id: new Types.ObjectId(lotId),
    clientId: new Types.ObjectId(clientId),
  });
  if (!lot) throw new AppError("Parking lot not found", 404);

  const zones = await ParkingZoneModel.find({
    clientId: new Types.ObjectId(clientId),
    lotId: new Types.ObjectId(lotId),
  }).lean();

  if (zones.length === 0) throw new AppError("No zones found in this lot", 404);

  const zoneMap = new Map(zones.map((z) => [z._id.toString(), z]));

  if (!zoneMap.has(fromZoneId)) throw new AppError("Source zone not found", 404);
  if (!zoneMap.has(toZoneId)) throw new AppError("Destination zone not found", 404);

  if (fromZoneId === toZoneId) {
    const z = zoneMap.get(fromZoneId)!;
    return [{ zoneId: fromZoneId, zoneName: z.name, cumulativeDistance: 0 }];
  }

  // Dijkstra
  const dist = new Map<string, number>();
  const prev = new Map<string, { fromZoneId: string; edgeType: string; edgeDist: number }>();
  dist.set(fromZoneId, 0);

  const queue: { id: string; d: number }[] = [{ id: fromZoneId, d: 0 }];

  while (queue.length > 0) {
    queue.sort((a, b) => a.d - b.d);
    const { id, d } = queue.shift()!;

    if (id === toZoneId) break;
    if (d > (dist.get(id) ?? Infinity)) continue;

    const zone = zoneMap.get(id);
    if (!zone) continue;

    for (const conn of zone.connections) {
      const nId = conn.zoneId.toString();
      const newDist = d + conn.distance;
      if (newDist < (dist.get(nId) ?? Infinity)) {
        dist.set(nId, newDist);
        prev.set(nId, { fromZoneId: id, edgeType: conn.edgeType, edgeDist: conn.distance });
        queue.push({ id: nId, d: newDist });
      }
    }
  }

  // Reconstruct path backward
  const path: NavigationStep[] = [];
  let cur = toZoneId;

  while (cur !== fromZoneId) {
    const p = prev.get(cur);
    if (!p) break; // disconnected graph — return partial path
    const z = zoneMap.get(cur)!;
    path.unshift({
      zoneId: cur,
      zoneName: z.name,
      edgeType: p.edgeType as "walkway" | "ramp" | "elevator",
      distance: p.edgeDist,
      cumulativeDistance: dist.get(cur) ?? 0,
    });
    cur = p.fromZoneId;
  }

  const startZone = zoneMap.get(fromZoneId)!;
  path.unshift({ zoneId: fromZoneId, zoneName: startZone.name, cumulativeDistance: 0 });

  return path;
}
