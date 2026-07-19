import express from "express";
import cors from "cors";
import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import pricingRulesRoutes from "./routes/pricingRules.routes";
import billingRoutes from "./routes/billing.routes";

export function createApp() {
  const app = express();
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  app.get("/health", (_req, res) => res.json({ status: "ok", service: "pricing-billing-service" }));
  app.use("/pricing-rules", pricingRulesRoutes);
  app.use("/billing", billingRoutes);
  app.use(errorHandler);
  return app;
}
