import express from "express";
import cors from "cors";
import { config } from "./config";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth.routes";
import clientsRoutes from "./routes/clients.routes";
import usersRoutes from "./routes/users.routes";

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "auth-service" }));

  app.use("/auth", authRoutes);
  app.use("/clients", clientsRoutes);
  app.use("/clients/:clientId/users", usersRoutes);

  app.use(errorHandler);

  return app;
}
