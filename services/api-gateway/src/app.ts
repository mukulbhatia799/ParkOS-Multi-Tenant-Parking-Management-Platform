import express from "express";
import cors from "cors";
import { config } from "./config";
import proxyRoutes from "./routes/proxy.routes";
import dashboardRoutes from "./routes/dashboard.routes";

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "api-gateway" }));

  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api", proxyRoutes);

  return app;
}
