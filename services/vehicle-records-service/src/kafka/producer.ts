import { Kafka, Producer } from "kafkajs";
import { v4 as uuidv4 } from "uuid";
import { KafkaEventEnvelope, Topics } from "@parking/shared";
import { config } from "../config";

const kafka = new Kafka({
  clientId: config.kafkaClientId,
  brokers: config.kafkaBrokers,
});

let producer: Producer | null = null;

export async function getProducer(): Promise<Producer> {
  if (!producer) {
    producer = kafka.producer();
    await producer.connect();
    console.log("[vehicle-records-service] kafka producer connected");
  }
  return producer;
}

export async function publishEvent<T>(
  topic: string,
  tenantId: string,
  eventType: string,
  payload: T
): Promise<void> {
  try {
    const p = await getProducer();
    const envelope: KafkaEventEnvelope<T> = {
      eventId: uuidv4(),
      eventType,
      occurredAt: new Date().toISOString(),
      tenantId,
      version: 1,
      payload,
    };
    await p.send({
      topic,
      messages: [{ key: tenantId, value: JSON.stringify(envelope) }],
    });
  } catch (err) {
    console.error(`[vehicle-records-service] failed to publish event ${eventType} on ${topic}`, err);
  }
}

export const KafkaTopics = Topics;
export { kafka };
