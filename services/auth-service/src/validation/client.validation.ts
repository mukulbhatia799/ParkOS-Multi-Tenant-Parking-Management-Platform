import { z } from "zod";
import { SubscriptionPlan, ClientStatus } from "@parking/shared";

export const createClientSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  subscriptionPlan: z.nativeEnum(SubscriptionPlan).optional(),
  settings: z
    .object({
      timezone: z.string().optional(),
      currency: z.string().optional(),
    })
    .optional(),
});

export const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  subscriptionPlan: z.nativeEnum(SubscriptionPlan).optional(),
  status: z.nativeEnum(ClientStatus).optional(),
  settings: z
    .object({
      timezone: z.string().optional(),
      currency: z.string().optional(),
    })
    .optional(),
});
