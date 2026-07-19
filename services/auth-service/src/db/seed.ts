import { connectDb } from "../db";
import { ClientModel } from "../models/client.model";
import { UserModel } from "../models/user.model";
import { hashPassword } from "../utils/password";
import { Role, SubscriptionPlan } from "@parking/shared";
import mongoose from "mongoose";

async function seed() {
  await connectDb();

  console.log("[auth-service] seeding...");

  // Super Admin (clientId = null)
  let superAdmin = await UserModel.findOne({ email: "super@platform.com" });
  if (!superAdmin) {
    superAdmin = await UserModel.create({
      clientId: null,
      name: "Platform Super Admin",
      email: "super@platform.com",
      passwordHash: await hashPassword("Password123!"),
      role: Role.SUPER_ADMIN,
      assignedLotIds: [],
    });
    console.log("Created super admin: super@platform.com / Password123!");
  }

  // Demo Client
  let demoClient = await ClientModel.findOne({ slug: "demo-mall" });
  if (!demoClient) {
    demoClient = await ClientModel.create({
      name: "Demo Mall",
      slug: "demo-mall",
      contactEmail: "admin@demomall.com",
      subscriptionPlan: SubscriptionPlan.PRO,
      settings: { timezone: "UTC", currency: "USD" },
    });
    console.log(`Created client: Demo Mall (${demoClient._id.toString()})`);
  }

  // Client Admin
  const existingClientAdmin = await UserModel.findOne({ email: "admin@demomall.com" });
  if (!existingClientAdmin) {
    await UserModel.create({
      clientId: demoClient._id,
      name: "Demo Mall Admin",
      email: "admin@demomall.com",
      passwordHash: await hashPassword("Password123!"),
      role: Role.CLIENT_ADMIN,
      assignedLotIds: [],
    });
    console.log("Created client admin: admin@demomall.com / Password123!");
  }

  // Operator
  const existingOperator = await UserModel.findOne({ email: "operator@demomall.com" });
  if (!existingOperator) {
    await UserModel.create({
      clientId: demoClient._id,
      name: "Demo Mall Operator",
      email: "operator@demomall.com",
      passwordHash: await hashPassword("Password123!"),
      role: Role.OPERATOR,
      assignedLotIds: [],
    });
    console.log("Created operator: operator@demomall.com / Password123!");
  }

  console.log(`[auth-service] Demo Client ID: ${demoClient._id.toString()}`);
  console.log("[auth-service] seeding complete.");

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error("[auth-service] seed failed", err);
  process.exit(1);
});
