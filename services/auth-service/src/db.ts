import mongoose from "mongoose";
import { config } from "./config";

export async function connectDb(): Promise<void> {
  mongoose.set("strictQuery", true);

  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    try {
      await mongoose.connect(config.mongoUri);
      console.log(`[auth-service] connected to MongoDB at ${config.mongoUri}`);
      return;
    } catch (err) {
      attempts += 1;
      console.error(`[auth-service] MongoDB connection failed (attempt ${attempts}/${maxAttempts})`, err);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  throw new Error("[auth-service] could not connect to MongoDB after multiple attempts");
}
