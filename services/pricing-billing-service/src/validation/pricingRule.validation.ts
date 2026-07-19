import { z } from "zod";

export const createPricingRuleSchema = z.object({
  lotId: z.string().min(1),
  name: z.string().min(1),
  ratePerHour: z.number().min(0),
  currency: z.string().default("INR"),
  gracePeriodMinutes: z.number().min(0).default(0),
  maxDailyCharge: z.number().min(0).optional(),
});

export const updatePricingRuleSchema = z.object({
  name: z.string().min(1).optional(),
  ratePerHour: z.number().min(0).optional(),
  currency: z.string().optional(),
  gracePeriodMinutes: z.number().min(0).optional(),
  maxDailyCharge: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
});
