import { kafka } from "./producer";
import { config } from "../config";
import { CameraType, CvPlateDetectedPayload, KafkaEventEnvelope, Topics } from "@parking/shared";
import { assignSlot } from "../clients/parkingCoreClient";
import { signInternalToken } from "../utils/serviceToken";
import * as recordsService from "../services/records.service";

async function handleCvPlateDetected(envelope: KafkaEventEnvelope<CvPlateDetectedPayload>) {
  const { tenantId: clientId, payload } = envelope;
  const token = signInternalToken(clientId);

  if (payload.cameraType === CameraType.ENTRY) {
    const existing = await recordsService.findActiveRecordByPlate(clientId, payload.licensePlate);
    if (existing) {
      console.warn(
        `[vehicle-records-service] CV_PLATE_DETECTED entry: ${payload.licensePlate} already has an active record, skipping`
      );
      return;
    }

    const slot = await assignSlot(token, payload.lotId);
    if (!slot) {
      console.warn(`[vehicle-records-service] CV_PLATE_DETECTED entry: lot ${payload.lotId} has no available slots, skipping`);
      return;
    }

    await recordsService.createEntry(clientId, token, {
      lotId: payload.lotId,
      slotId: slot._id,
      licensePlate: payload.licensePlate,
    });
    console.log(`[vehicle-records-service] auto entry created for ${payload.licensePlate} in slot ${slot.slotNumber}`);
    return;
  }

  // CameraType.EXIT
  const record = await recordsService.findActiveRecordByPlate(clientId, payload.licensePlate);
  if (!record) {
    console.warn(
      `[vehicle-records-service] CV_PLATE_DETECTED exit: no active record for ${payload.licensePlate}, skipping`
    );
    return;
  }

  await recordsService.createExit(clientId, record._id.toString());
  console.log(`[vehicle-records-service] auto exit completed for ${payload.licensePlate}`);
}

export async function startConsumer(): Promise<void> {
  const consumer = kafka.consumer({ groupId: config.kafkaGroupId });
  await consumer.connect();

  const topics = [Topics.CV_PLATE_DETECTED, Topics.SLOT_ASSIGNED];

  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false }).catch(() => {
      // topic may not exist yet - safe to ignore
    });
  }

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) return;

      try {
        const envelope = JSON.parse(message.value.toString());

        if (topic === Topics.CV_PLATE_DETECTED) {
          await handleCvPlateDetected(envelope as KafkaEventEnvelope<CvPlateDetectedPayload>);
        }
        // Topics.SLOT_ASSIGNED reserved for chunk 5 (smart slot assignment)
      } catch (err) {
        console.error(`[vehicle-records-service] error handling event on ${topic}`, err);
      }
    },
  });

  console.log("[vehicle-records-service] kafka consumer started");
}
