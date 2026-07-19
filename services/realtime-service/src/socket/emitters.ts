import { Server } from "socket.io";
import { KafkaEventEnvelope, Topics } from "@parking/shared";
import { tenantRoom, lotRoom } from "./rooms";

interface LotScopedPayload {
  lotId: string;
}

export function registerKafkaToSocketBridge(io: Server) {
  return {
    handle: (topic: string, envelope: KafkaEventEnvelope<unknown>) => {
      const payload = envelope.payload as LotScopedPayload;
      const tenantId = envelope.tenantId;

      const targetRoom = payload?.lotId ? lotRoom(tenantId, payload.lotId) : tenantRoom(tenantId);

      switch (topic) {
        case Topics.SLOT_STATUS_CHANGED:
          io.to(targetRoom).to(tenantRoom(tenantId)).emit("slot:updated", envelope.payload);
          break;
        case Topics.SLOT_ASSIGNED:
          io.to(targetRoom).to(tenantRoom(tenantId)).emit("slot:assigned", envelope.payload);
          break;
        case Topics.SLOT_RELEASED:
          io.to(targetRoom).to(tenantRoom(tenantId)).emit("slot:released", envelope.payload);
          break;
        case Topics.CV_PLATE_DETECTED:
          io.to(targetRoom).to(tenantRoom(tenantId)).emit("detection:created", envelope.payload);
          break;
        case Topics.FEE_CALCULATED:
          io.to(targetRoom).to(tenantRoom(tenantId)).emit("fee:calculated", envelope.payload);
          break;
        default:
          console.log(`[realtime-service] unhandled topic ${topic}`);
      }
    },
  };
}
