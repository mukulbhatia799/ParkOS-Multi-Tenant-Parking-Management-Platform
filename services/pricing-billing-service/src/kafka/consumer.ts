import { KafkaEventEnvelope, ParkingRecordExitDetectedPayload, Topics } from "@parking/shared";
import { FeeCalculatedPayload } from "@parking/shared";
import { kafka } from "./producer";
import { publishEvent } from "./producer";
import { config } from "../config";
import { PricingRuleModel } from "../models/pricingRule.model";
import { BillingRecordModel } from "../models/billingRecord.model";

export async function startConsumer(): Promise<void> {
  const consumer = kafka.consumer({ groupId: config.kafkaGroupId });
  await consumer.connect();
  await consumer.subscribe({ topic: Topics.PARKING_RECORD_EXIT_DETECTED, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      try {
        const envelope = JSON.parse(message.value.toString()) as KafkaEventEnvelope<ParkingRecordExitDetectedPayload>;
        const payload = envelope.payload;
        const clientId = envelope.tenantId;

        // Idempotency: skip if billing record already exists
        const existing = await BillingRecordModel.findOne({ parkingRecordId: payload.recordId });
        if (existing) return;

        // Find active pricing rule for this lot
        const rule = await PricingRuleModel.findOne({
          clientId,
          lotId: payload.lotId,
          isActive: true,
        });

        const duration = payload.durationMinutes ?? 0;
        let amountDue = 0;
        let currency = "INR";

        if (rule) {
          const billableMinutes = Math.max(0, duration - rule.gracePeriodMinutes);
          // Pro-rate by minute, round up to nearest rupee
          const raw = (billableMinutes / 60) * rule.ratePerHour;
          amountDue = Math.ceil(raw);
          if (rule.maxDailyCharge) amountDue = Math.min(amountDue, rule.maxDailyCharge);
          currency = rule.currency;
        }

        const billing = await BillingRecordModel.create({
          clientId,
          parkingRecordId: payload.recordId,
          lotId: payload.lotId,
          licensePlate: payload.licensePlate,
          durationMinutes: duration,
          amountDue,
          currency,
          pricingRuleId: rule?._id,
          calculatedAt: new Date(),
        });

        const feePayload: FeeCalculatedPayload = {
          billingRecordId: billing._id.toString(),
          parkingRecordId: payload.recordId,
          lotId: payload.lotId,
          licensePlate: payload.licensePlate,
          durationMinutes: duration,
          amountDue,
          currency,
        };

        await publishEvent(Topics.FEE_CALCULATED, clientId, Topics.FEE_CALCULATED, feePayload);
        console.log(
          `[pricing-billing-service] fee calculated: ${payload.licensePlate} → ${currency} ${amountDue} (${duration} min)`
        );
      } catch (err) {
        console.error("[pricing-billing-service] error processing exitDetected event", err);
      }
    },
  });

  console.log("[pricing-billing-service] kafka consumer started");
}
