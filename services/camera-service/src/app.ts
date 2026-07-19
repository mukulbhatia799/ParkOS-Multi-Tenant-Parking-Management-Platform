import express from "express";
import cors from "cors";
import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import camerasRoutes from "./routes/cameras.routes";
import detectionsRoutes from "./routes/detections.routes";
import cvIngestRoutes from "./routes/cvIngest.routes";

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: "8mb" }));

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "camera-service" }));

  app.use("/cameras", camerasRoutes);
  app.use("/detections", detectionsRoutes);
  app.use("/cv-ingest", cvIngestRoutes);

  app.use(errorHandler);

  return app;
}
