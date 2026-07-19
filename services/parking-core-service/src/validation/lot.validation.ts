import { z } from "zod";

export const createLotSchema = z.object({
  clientId: z.string().optional(), // required for super_admin, ignored for tenant-scoped users
  name: z.string().min(1),
  address: z.string().optional(),
  geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
  totalCapacity: z.number().int().nonnegative().default(0),
  operatingHours: z.object({ open: z.string(), close: z.string() }).optional(),
  defaultCurrency: z.string().optional(),
});

export const updateLotSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
  totalCapacity: z.number().int().nonnegative().optional(),
  operatingHours: z.object({ open: z.string(), close: z.string() }).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  defaultCurrency: z.string().optional(),
});
