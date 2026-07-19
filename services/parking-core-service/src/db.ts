import mongoose from "mongoose";
import { config } from "./config";

export async function connectDb(): Promise<void> {
  mongoose.set("strictQuery", true);

  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    try {
      await mongoose.connect(config.mongoUri);
      console.log(`[parking-core-service] connected to MongoDB at ${config.mongoUri}`);
      return;
    } catch (err) {
      attempts += 1;
      console.error(`[parking-core-service] MongoDB connection failed (attempt ${attempts}/${maxAttempts})`, err);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  throw new Error("[parking-core-service] could not connect to MongoDB after multiple attempts");
}
