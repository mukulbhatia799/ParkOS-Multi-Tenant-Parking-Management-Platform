import { PricingRuleModel } from "../models/pricingRule.model";
import { AppError } from "../utils/AppError";

export async function listRules(clientId: string, lotId?: string) {
  const query: Record<string, unknown> = { clientId };
  if (lotId) query.lotId = lotId;
  return PricingRuleModel.find(query).sort({ createdAt: -1 });
}

export async function createRule(clientId: string, body: {
  lotId: string; name: string; ratePerHour: number;
  currency: string; gracePeriodMinutes: number; maxDailyCharge?: number;
}) {
  return PricingRuleModel.create({ ...body, clientId });
}

export async function updateRule(clientId: string, ruleId: string, body: Partial<{
  name: string; ratePerHour: number; currency: string;
  gracePeriodMinutes: number; maxDailyCharge: number; isActive: boolean;
}>) {
  const rule = await PricingRuleModel.findOneAndUpdate(
    { _id: ruleId, clientId },
    { $set: body },
    { new: true }
  );
  if (!rule) throw new AppError("Pricing rule not found", 404);
  return rule;
}

export async function deleteRule(clientId: string, ruleId: string) {
  const rule = await PricingRuleModel.findOneAndDelete({ _id: ruleId, clientId });
  if (!rule) throw new AppError("Pricing rule not found", 404);
}
