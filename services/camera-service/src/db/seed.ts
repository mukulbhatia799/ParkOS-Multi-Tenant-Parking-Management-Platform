import mongoose from "mongoose";
import { connectDb } from "../db";
import { CameraModel } from "../models/camera.model";
import { CameraStatus, CameraType } from "@parking/shared";

/**
 * Looks up the "Demo Mall" client created by auth-service's seed script,
 * by reading directly from the auth-db (same mongo instance, different db).
 */
async function findDemoClientId(): Promise<string> {
  const authDbUri = (process.env.MONGO_URI || "mongodb://localhost:27017/camera-db").replace(/\/[^/]+$/, "/auth-db");

  const conn = await mongoose.createConnection(authDbUri).asPromise();
  const client = await conn.collection("clients").findOne({ slug: "demo-mall" });
  await conn.close();

  if (!client) {
    throw new Error('Demo client "demo-mall" not found in auth-db. Run auth-service seed first.');
  }
  return client._id.toString();
}

/**
 * Looks up the demo lot created by parking-core-service's seed script.
 */
async function findDemoLotId(clientId: string): Promise<string> {
  const parkingCoreDbUri = (process.env.MONGO_URI || "mongodb://localhost:27017/camera-db").replace(
    /\/[^/]+$/,
    "/parking-core-db"
  );

  const conn = await mongoose.createConnection(parkingCoreDbUri).asPromise();
  const lot = await conn.collection("parkinglots").findOne({ clientId: new mongoose.Types.ObjectId(clientId) });
  await conn.close();

  if (!lot) {
    throw new Error("Demo parking lot not found in parking-core-db. Run parking-core-service seed first.");
  }
  return lot._id.toString();
}

async function seed() {
  await connectDb();

  const clientId = await findDemoClientId();
  const lotId = await findDemoLotId(clientId);
  console.log(`[camera-service] seeding cameras for client ${clientId}, lot ${lotId}...`);

  const cameraDefs = [
    { name: "Main Gate - Entry", cameraType: CameraType.ENTRY },
    { name: "Main Gate - Exit", cameraType: CameraType.EXIT },
  ];

  for (const def of cameraDefs) {
    const existing = await CameraModel.findOne({ clientId, lotId, name: def.name });
    if (existing) continue;

    await CameraModel.create({
      clientId,
      lotId,
      name: def.name,
      cameraType: def.cameraType,
      status: CameraStatus.ACTIVE,
    });
    console.log(`Created camera: ${def.name}`);
  }

  console.log("[camera-service] seeding complete.");
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[camera-service] seed failed", err);
  process.exit(1);
});
