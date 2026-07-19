import mongoose from "mongoose";
import { config } from "./config";

export async function connectDb(): Promise<void> {
  mongoose.set("strictQuery", true);
  let attempts = 0;
  while (attempts < 10) {
    try {
      await mongoose.connect(config.mongoUri);
      console.log(`[pricing-billing-service] connected to MongoDB at ${config.mongoUri}`);
      return;
    } catch (err) {
      attempts++;
      console.error(`[pricing-billing-service] MongoDB connection failed (attempt ${attempts}/10)`, err);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw new Error("[pricing-billing-service] could not connect to MongoDB");
}
