import mongoose from "mongoose";
import { connectDb } from "../db";
import { VehicleModel } from "../models/vehicle.model";
import { ParkingRecordModel } from "../models/parkingRecord.model";
import { ParkingRecordStatus, SlotStatus, VehicleType } from "@parking/shared";

/**
 * Looks up the "Demo Mall" client created by auth-service's seed script,
 * by reading directly from the auth-db (same mongo instance, different db).
 */
async function findDemoClientId(): Promise<string> {
  const authDbUri = (process.env.MONGO_URI || "mongodb://localhost:27017/vehicle-records-db").replace(
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

/**
 * Looks up the demo lot's currently occupied slots from parking-core-service's
 * seed data, by reading directly from the parking-core-db.
 */
async function findOccupiedSlots(clientId: string): Promise<
  Array<{ _id: string; lotId: string; zoneId: string; slotNumber: string }>
> {
  const parkingCoreDbUri = (process.env.MONGO_URI || "mongodb://localhost:27017/vehicle-records-db").replace(
    /\/[^/]+$/,
    "/parking-core-db"
  );

  const conn = await mongoose.createConnection(parkingCoreDbUri).asPromise();
  const slots = await conn
    .collection("parkingslots")
    .find({ clientId: new mongoose.Types.ObjectId(clientId), status: SlotStatus.OCCUPIED })
    .toArray();
  await conn.close();

  return slots.map((s) => ({
    _id: s._id.toString(),
    lotId: s.lotId.toString(),
    zoneId: s.zoneId.toString(),
    slotNumber: s.slotNumber,
  }));
}

const SAMPLE_PLATES = ["MH12AB1234", "DL3CAF5678", "KA01XY9999"];

async function seed() {
  await connectDb();

  const clientId = await findDemoClientId();
  console.log(`[vehicle-records-service] seeding for client ${clientId}...`);

  const occupiedSlots = await findOccupiedSlots(clientId);
  if (occupiedSlots.length === 0) {
    console.log("[vehicle-records-service] no occupied slots found - run parking-core-service seed first. Skipping.");
  }

  for (let i = 0; i < occupiedSlots.length; i++) {
    const slot = occupiedSlots[i];
    const licensePlate = SAMPLE_PLATES[i % SAMPLE_PLATES.length];

    const existingRecord = await ParkingRecordModel.findOne({ clientId, slotId: slot._id, status: ParkingRecordStatus.ACTIVE });
    if (existingRecord) continue;

    let vehicle = await VehicleModel.findOne({ clientId, licensePlate });
    if (!vehicle) {
      vehicle = await VehicleModel.create({ clientId, licensePlate, type: VehicleType.CAR });
      console.log(`Created vehicle: ${vehicle.licensePlate}`);
    }

    await ParkingRecordModel.create({
      clientId,
      lotId: slot.lotId,
      zoneId: slot.zoneId,
      slotId: slot._id,
      slotNumber: slot.slotNumber,
      vehicleId: vehicle._id,
      licensePlate: vehicle.licensePlate,
      vehicleType: vehicle.type,
      status: ParkingRecordStatus.ACTIVE,
      entryTime: new Date(),
    });
    console.log(`Created active parking record for ${vehicle.licensePlate} in slot ${slot.slotNumber}`);
  }

  const unparkedPlate = "TN09ZZ0001";
  const existingUnparked = await VehicleModel.findOne({ clientId, licensePlate: unparkedPlate });
  if (!existingUnparked) {
    await VehicleModel.create({ clientId, licensePlate: unparkedPlate, type: VehicleType.BIKE });
    console.log(`Created registered (not parked) vehicle: ${unparkedPlate}`);
  }

  console.log("[vehicle-records-service] seeding complete.");
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[vehicle-records-service] seed failed", err);
  process.exit(1);
});
