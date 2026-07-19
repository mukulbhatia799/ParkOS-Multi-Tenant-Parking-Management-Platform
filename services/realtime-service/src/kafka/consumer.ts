import { Kafka } from "kafkajs";
import { Server } from "socket.io";
import { KafkaEventEnvelope, Topics } from "@parking/shared";
import { config } from "../config";
import { registerKafkaToSocketBridge } from "../socket/emitters";

const kafka = new Kafka({
  clientId: config.kafkaClientId,
  brokers: config.kafkaBrokers,
});

export async function startConsumer(io: Server): Promise<void> {
  const consumer = kafka.consumer({ groupId: config.kafkaGroupId });
  await consumer.connect();

  const topics = [Topics.SLOT_STATUS_CHANGED, Topics.SLOT_ASSIGNED, Topics.SLOT_RELEASED, Topics.CV_PLATE_DETECTED, Topics.FEE_CALCULATED];

  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false }).catch(() => {
      // topic may not exist yet - safe to ignore
    });
  }

  const bridge = registerKafkaToSocketBridge(io);

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) return;
      try {
        const envelope: KafkaEventEnvelope<unknown> = JSON.parse(message.value.toString());
        bridge.handle(topic, envelope);
      } catch (err) {
        console.error(`[realtime-service] failed to process message on ${topic}`, err);
      }
    },
  });

  console.log("[realtime-service] kafka consumer started");
}
