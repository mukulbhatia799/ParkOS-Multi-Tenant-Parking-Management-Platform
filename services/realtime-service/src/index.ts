import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { config } from "./config";
import { socketAuthMiddleware, AuthenticatedSocket } from "./socket/auth";
import { tenantRoom, lotRoom } from "./socket/rooms";
import { startConsumer } from "./kafka/consumer";

async function main() {
  const app = express();
  app.use(cors({ origin: config.corsOrigin }));

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "realtime-service" }));

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: config.corsOrigin },
  });

  io.use(socketAuthMiddleware);

  io.on("connection", (socket: AuthenticatedSocket) => {
    const user = socket.user!;
    console.log(`[realtime-service] socket connected: user=${user.sub} clientId=${user.clientId}`);

    if (user.clientId) {
      socket.join(tenantRoom(user.clientId));

      for (const lotId of user.assignedLotIds || []) {
        socket.join(lotRoom(user.clientId, lotId));
      }
    }

    socket.on("subscribe:lot", (lotId: string) => {
      if (user.clientId) {
        socket.join(lotRoom(user.clientId, lotId));
      }
    });

    socket.on("disconnect", () => {
      console.log(`[realtime-service] socket disconnected: user=${user.sub}`);
    });
  });

  await startConsumer(io);

  httpServer.listen(config.port, () => {
    console.log(`[realtime-service] listening on port ${config.port}`);
  });
}

main().catch((err) => {
  console.error("[realtime-service] fatal startup error", err);
  process.exit(1);
});
