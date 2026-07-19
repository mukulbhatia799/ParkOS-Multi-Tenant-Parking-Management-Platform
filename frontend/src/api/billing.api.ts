import { apiClient } from "./client";
import { BillingRecord, PricingRule } from "../types";

export async function getPricingRules(lotId?: string): Promise<PricingRule[]> {
  const { data } = await apiClient.get("/pricing-rules", { params: lotId ? { lotId } : {} });
  return data;
}

export async function createPricingRule(body: {
  lotId: string;
  name: string;
  ratePerHour: number;
  currency?: string;
  gracePeriodMinutes?: number;
  maxDailyCharge?: number;
}): Promise<PricingRule> {
  const { data } = await apiClient.post("/pricing-rules", body);
  return data;
}

export async function updatePricingRule(ruleId: string, body: Partial<PricingRule>): Promise<PricingRule> {
  const { data } = await apiClient.patch(`/pricing-rules/${ruleId}`, body);
  return data;
}

export async function deletePricingRule(ruleId: string): Promise<void> {
  await apiClient.delete(`/pricing-rules/${ruleId}`);
}

export async function getBillingRecords(lotId?: string): Promise<BillingRecord[]> {
  const { data } = await apiClient.get("/billing", { params: lotId ? { lotId } : {} });
  return data;
}

export async function getBillingByRecord(parkingRecordId: string): Promise<BillingRecord> {
  const { data } = await apiClient.get(`/billing/by-record/${parkingRecordId}`);
  return data;
}
