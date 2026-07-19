import mongoose from "mongoose";
import { connectDb } from "../db";
import { PricingRuleModel } from "../models/pricingRule.model";

async function findDemoClientId(): Promise<string> {
  const authDbUri = (process.env.MONGO_URI || "mongodb://localhost:27017/pricing-db").replace(/\/[^/?]+(\?|$)/, "/auth-db$1");
  const conn = await mongoose.createConnection(authDbUri).asPromise();
  const client = await conn.collection("clients").findOne({ slug: "demo-mall" });
  await conn.close();
  if (!client) throw new Error('Demo client "demo-mall" not found in auth-db. Run auth-service seed first.');
  return client._id.toString();
}

async function findDemoLotId(clientId: string): Promise<string> {
  const parkingCoreDbUri = (process.env.MONGO_URI || "mongodb://localhost:27017/pricing-db").replace(/\/[^/?]+(\?|$)/, "/parking-core-db$1");
  const conn = await mongoose.createConnection(parkingCoreDbUri).asPromise();
  const lot = await conn.collection("parkinglots").findOne({ clientId: new mongoose.Types.ObjectId(clientId) });
  await conn.close();
  if (!lot) throw new Error("Demo parking lot not found. Run parking-core-service seed first.");
  return lot._id.toString();
}

async function seed() {
  await connectDb();
  const clientId = await findDemoClientId();
  const lotId = await findDemoLotId(clientId);
  console.log(`[pricing-billing-service] seeding for client ${clientId}, lot ${lotId}...`);

  const existing = await PricingRuleModel.findOne({ clientId, lotId, name: "Standard Rate" });
  if (!existing) {
    await PricingRuleModel.create({
      clientId,
      lotId,
      name: "Standard Rate",
      ratePerHour: 50,
      currency: "INR",
      gracePeriodMinutes: 15,
      maxDailyCharge: 500,
      isActive: true,
    });
    console.log("Created pricing rule: Standard Rate — ₹50/hr, 15 min grace, max ₹500/day");
  }

  console.log("[pricing-billing-service] seeding complete.");
  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[pricing-billing-service] seed failed", err);
  process.exit(1);
});
