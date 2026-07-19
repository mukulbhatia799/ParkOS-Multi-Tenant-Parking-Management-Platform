import { kafka } from "./producer";
import { config } from "../config";
import { Topics, SlotStatus, ParkingRecordEntryDetectedPayload, ParkingRecordExitDetectedPayload, KafkaEventEnvelope } from "@parking/shared";
import { applyOccupancyChange } from "../services/slots.service";

export async function startConsumer(): Promise<void> {
  const consumer = kafka.consumer({ groupId: config.kafkaGroupId });
  await consumer.connect();

  const topics = [Topics.PARKING_RECORD_ENTRY_DETECTED, Topics.PARKING_RECORD_EXIT_DETECTED];

  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false }).catch(() => {
      // topic may not exist yet - safe to ignore
    });
  }

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) return;

      try {
        const envelope = JSON.parse(message.value.toString()) as KafkaEventEnvelope<unknown>;

        if (topic === Topics.PARKING_RECORD_ENTRY_DETECTED) {
          const payload = envelope.payload as ParkingRecordEntryDetectedPayload;
          await applyOccupancyChange(envelope.tenantId, payload.slotId, SlotStatus.OCCUPIED, payload.recordId);
        } else if (topic === Topics.PARKING_RECORD_EXIT_DETECTED) {
          const payload = envelope.payload as ParkingRecordExitDetectedPayload;
          await applyOccupancyChange(envelope.tenantId, payload.slotId, SlotStatus.AVAILABLE, null);
        }
      } catch (err) {
        console.error(`[parking-core-service] failed to process event on ${topic}`, err);
      }
    },
  });

  console.log("[parking-core-service] kafka consumer started");
}
