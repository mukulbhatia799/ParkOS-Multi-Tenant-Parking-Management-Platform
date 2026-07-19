import express from "express";
import cors from "cors";
import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import vehiclesRoutes from "./routes/vehicles.routes";
import recordsRoutes from "./routes/records.routes";

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "vehicle-records-service" }));

  app.use("/vehicles", vehiclesRoutes);
  app.use("/parking-records", recordsRoutes);

  app.use(errorHandler);

  return app;
}
