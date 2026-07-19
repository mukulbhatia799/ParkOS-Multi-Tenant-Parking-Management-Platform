import { BillingRecordModel } from "../models/billingRecord.model";
import { AppError } from "../utils/AppError";

export async function listBilling(clientId: string, filters: { lotId?: string; parkingRecordId?: string }) {
  const query: Record<string, unknown> = { clientId };
  if (filters.lotId) query.lotId = filters.lotId;
  if (filters.parkingRecordId) query.parkingRecordId = filters.parkingRecordId;
  return BillingRecordModel.find(query).sort({ createdAt: -1 }).limit(100);
}

export async function getBillingByRecord(clientId: string, parkingRecordId: string) {
  const record = await BillingRecordModel.findOne({ clientId, parkingRecordId });
  if (!record) throw new AppError("Billing record not found", 404);
  return record;
}
