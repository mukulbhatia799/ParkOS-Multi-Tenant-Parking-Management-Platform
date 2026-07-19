import express from "express";
import cors from "cors";
import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import lotsRoutes from "./routes/lots.routes";
import { lotZonesRouter, zoneRouter } from "./routes/zones.routes";
import { lotSlotsRouter, slotRouter } from "./routes/slots.routes";
import lotMapRoutes from "./routes/lotMap.routes";
import navigationRoutes from "./routes/navigation.routes";

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "parking-core-service" }));

  app.use("/lots", lotsRoutes);
  app.use("/lots/:lotId/zones", lotZonesRouter);
  app.use("/lots/:lotId/slots", lotSlotsRouter);
  app.use("/lots/:lotId/map", lotMapRoutes);
  app.use("/zones", zoneRouter);
  app.use("/slots", slotRouter);
  app.use("/navigation", navigationRoutes);

  app.use(errorHandler);

  return app;
}
