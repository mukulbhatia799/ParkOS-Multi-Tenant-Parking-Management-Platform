import mongoose from "mongoose";
import { connectDb } from "../db";
import { ParkingLotModel } from "../models/parkingLot.model";
import { ParkingZoneModel } from "../models/parkingZone.model";
import { ParkingSlotModel } from "../models/parkingSlot.model";
import { SlotStatus, SlotType, ZoneType } from "@parking/shared";

/**
 * Looks up the "Demo Mall" client created by auth-service's seed script,
 * by reading directly from the auth-db (same mongo instance, different db).
 */
async function findDemoClientId(): Promise<string> {
  const authDbUri = (process.env.MONGO_URI || "mongodb://localhost:27017/parking-core-db").replace(
    /\/[^/]+$/,
    "/auth-db"
  );

  const conn = await mongoose.createConnection(authDbUri).asPromise();
  const client = await conn.collection("clients").findOne({ slug: "demo-mall" });
  await conn.close();

  if (!client) {
    throw new Error('Demo client "demo-mall" not found in auth-db. Run auth-service seed first.');
  }
  return client._id.toString();
}

async function seed() {
  await connectDb();

  const clientId = new mongoose.Types.ObjectId(await findDemoClientId());
  console.log(`[parking-core-service] seeding for client ${clientId.toString()}...`);

  let lot = await ParkingLotModel.findOne({ clientId, name: "Demo Mall - Main Lot" });
  if (!lot) {
    lot = await ParkingLotModel.create({
      clientId,
      name: "Demo Mall - Main Lot",
      address: "123 Demo Street",
      totalCapacity: 20,
      defaultCurrency: "USD",
    });
    console.log(`Created lot: ${lot._id.toString()}`);
  }

  const existingZones = await ParkingZoneModel.find({ clientId, lotId: lot._id });
  let zones = existingZones;
  if (existingZones.length === 0) {
    zones = await ParkingZoneModel.insertMany([
      {
        clientId,
        lotId: lot._id,
        name: "Level 1 - Section A",
        type: ZoneType.SECTION,
        graphNode: { x: 0, y: 0, floor: 1 },
      },
      {
        clientId,
        lotId: lot._id,
        name: "Level 1 - Section B",
        type: ZoneType.SECTION,
        graphNode: { x: 1, y: 0, floor: 1 },
      },
      {
        clientId,
        lotId: lot._id,
        name: "Level 2 - Section A",
        type: ZoneType.SECTION,
        graphNode: { x: 0, y: 0, floor: 2 },
      },
    ]);
    console.log(`Created ${zones.length} zones`);
  }

  const existingSlots = await ParkingSlotModel.countDocuments({ clientId, lotId: lot._id });
  if (existingSlots === 0) {
    const slotDocs = [];
    const slotTypes = [SlotType.REGULAR, SlotType.REGULAR, SlotType.VIP, SlotType.EV, SlotType.DISABLED];
    let counter = 1;

    for (const zone of zones) {
      for (let i = 0; i < 5; i++) {
        slotDocs.push({
          clientId,
          lotId: lot._id,
          zoneId: zone._id,
          slotNumber: `${zone.name.includes("A") ? "A" : "B"}-${100 + counter}`,
          type: slotTypes[i % slotTypes.length],
          status: i === 0 ? SlotStatus.OCCUPIED : SlotStatus.AVAILABLE,
        });
        counter += 1;
      }
    }

    await ParkingSlotModel.insertMany(slotDocs);
    console.log(`Created ${slotDocs.length} slots`);
  }

  // Always upsert zone connections (idempotent — safe on re-runs)
  const freshZones = await ParkingZoneModel.find({ clientId, lotId: lot._id }).sort({ name: 1 });
  if (freshZones.length >= 2) {
    const [z0, z1, z2] = freshZones;
    // z0 ↔ z1: same floor, walkway
    await ParkingZoneModel.findByIdAndUpdate(z0._id, {
      $set: {
        connections: [
          { zoneId: z1._id, distance: 1, edgeType: "walkway" },
          ...(z2 ? [{ zoneId: z2._id, distance: 2, edgeType: "ramp" }] : []),
        ],
      },
    });
    await ParkingZoneModel.findByIdAndUpdate(z1._id, {
      $set: {
        connections: [
          { zoneId: z0._id, distance: 1, edgeType: "walkway" },
          ...(z2 ? [{ zoneId: z2._id, distance: 3, edgeType: "ramp" }] : []),
        ],
      },
    });
    if (z2) {
      await ParkingZoneModel.findByIdAndUpdate(z2._id, {
        $set: {
          connections: [
            { zoneId: z0._id, distance: 2, edgeType: "ramp" },
            { zoneId: z1._id, distance: 3, edgeType: "ramp" },
          ],
        },
      });
    }
    console.log("[parking-core-service] zone connections updated");
  }

  console.log("[parking-core-service] seeding complete.");
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[parking-core-service] seed failed", err);
  process.exit(1);
});
