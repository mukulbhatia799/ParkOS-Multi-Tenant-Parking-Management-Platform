export interface KafkaEventEnvelope<T> {
  eventId: string;
  eventType: string;
  occurredAt: string;
  tenantId: string;
  version: number;
  payload: T;
}
